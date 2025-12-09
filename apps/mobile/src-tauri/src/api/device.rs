// 设备相关 API 命令 - 对应前端 src/api/device.ts

use crate::discovery::start_file_receiver_task;
use crate::state::AppState;
use stationuli_core::p2p::mdns::{DeviceInfo, MdnsDiscovery};
use stationuli_core::p2p::tcp::TcpConnection;
use tauri::{AppHandle, State};

/// 启动设备发现服务
#[tauri::command]
pub async fn start_discovery(
  port: u16,
  state: State<'_, AppState>,
  app: AppHandle,
) -> Result<String, String> {
  use tracing::info;

  info!("🚀 启动服务 (端口: {})", port);

  // 先停止旧的服务和 TCP listener（如果存在）
  if let Some(mut discovery) = state.inner().discovery.write().await.take() {
    info!("🔄 检测到旧服务，正在停止...");
    // 使用超时保护，防止卡住
    // 设置超时时间为1分钟，确保有足够时间清理资源
    let stop_result =
      tokio::time::timeout(tokio::time::Duration::from_secs(60), discovery.stop()).await;

    match stop_result {
      Ok(Ok(())) => {
        info!("✅ 旧服务已停止");
      }
      Ok(Err(e)) => {
        info!("⚠️ 停止旧服务时出错: {}，继续清理资源", e);
      }
      Err(_) => {
        info!("⚠️ 停止旧服务超时，强制清理资源");
      }
    }
  }

  // 清理 TCP listener（这会触发文件接收任务检测到 listener 不存在并退出循环）
  info!("🔹 清理旧的 TCP Listener...");

  // 尝试获取写锁清理 TCP Listener（带超时）
  let cleanup_result = tokio::time::timeout(
    tokio::time::Duration::from_secs(5),
    state.inner().tcp_listener.write(),
  )
  .await;

  match cleanup_result {
    Ok(mut guard) => {
      let old_listener = guard.take();
      drop(guard);
      if old_listener.is_some() {
        info!("✅ 旧的 TCP Listener 已清理");
      } else {
        info!("ℹ️  没有旧的 TCP Listener 需要清理");
      }
    }
    Err(_) => {
      let timeout_msg = "⚠️  清理旧的 TCP Listener 超时（5秒）";
      let detailed_msg = format!(
        "{} - 可能原因：文件接收任务正在阻塞等待连接（accept()），持有读锁无法释放",
        timeout_msg
      );
      info!("{}", detailed_msg);
      info!("⚠️  强制继续：尝试直接绑定新端口（如果端口被占用会失败）");
      // 注意：这里无法获取写锁，但我们可以尝试继续启动，如果端口被占用会失败
    }
  }

  // 等待更长时间，确保文件接收任务检测到 listener 不存在并退出循环
  info!("⏳ 等待文件接收任务退出（500ms）...");
  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 启动新的服务（只获取本地IP，不启动自动发现）
  let mut discovery = MdnsDiscovery::new(port);
  discovery.set_device_type("mobile".to_string());
  discovery
    .start()
    .await
    .map_err(|e| format!("Failed to start service: {}", e))?;

  *state.inner().discovery.write().await = Some(discovery);

  // 启动 TCP 服务器监听文件接收
  info!("📡 TCP 监听器启动中 (端口: {})...", port);

  // 如果之前的清理失败，端口可能还被占用，这里会失败
  // 如果失败，尝试再次强制清理并重试
  let listener_result = TcpConnection::listen(port).await;

  let listener = match listener_result {
    Ok(listener) => listener,
    Err(e) => {
      let err_msg = format!("Failed to start TCP listener on port {}: {}", port, e);
      info!("{}", err_msg);

      // 如果端口被占用，尝试再次强制清理
      if err_msg.contains("address already in use")
        || err_msg.contains("端口")
        || err_msg.contains("Address already in use")
        || err_msg.contains("already bound")
      {
        info!("⚠️  端口可能仍被占用，尝试强制清理...");

        // 再次尝试清理（不等待超时，直接尝试）
        let force_cleanup = tokio::time::timeout(
          tokio::time::Duration::from_secs(1),
          state.inner().tcp_listener.write(),
        )
        .await;

        if let Ok(mut guard) = force_cleanup {
          let _ = guard.take();
          drop(guard);
          info!("✅ 强制清理完成，等待端口释放（1秒）...");
          tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }

        // 重试绑定端口
        info!("🔄 重试绑定端口 {}...", port);
        TcpConnection::listen(port).await.map_err(|e2| {
          let err_msg2 = format!("重试绑定端口失败: {} (原始错误: {})", e2, e);
          info!("{}", err_msg2);
          err_msg2
        })?
      } else {
        return Err(err_msg);
      }
    }
  };

  info!("✅ TCP 监听器已启动 (端口: {})", port);
  *state.inner().tcp_listener.write().await = Some(listener);

  // 启动文件接收任务
  start_file_receiver_task(
    state.inner().tcp_listener.clone(),
    state.inner().file_transfer.clone(),
    app.clone(),
  );

  Ok("Service started".to_string())
}

/// 停止设备发现服务
#[tauri::command]
pub async fn stop_discovery(state: State<'_, AppState>) -> Result<(), String> {
  use tracing::info;

  info!("🛑 停止服务");

  // 停止服务（使用超时保护，防止卡住）
  // 设置超时时间为1分钟，确保有足够时间清理资源
  info!("📋 开始停止服务，需要清理以下资源：");
  info!("  1. MdnsDiscovery (设备发现服务)");
  info!("     - mDNS 服务注册");
  info!("     - 发现任务");
  info!("     - 广播任务");
  info!("     - 设备列表");
  info!("     - mDNS 响应器");
  info!("     - 本地 IP 缓存");
  info!("  2. TCP Listener (TCP 监听器)");
  info!("  3. 文件接收任务 (通过清理 TCP Listener 触发退出)");

  let stop_result = tokio::time::timeout(tokio::time::Duration::from_secs(60), async {
    // 步骤1: 停止 MdnsDiscovery
    info!("🔹 Step 1: 停止 MdnsDiscovery...");

    if let Some(mut discovery) = state.inner().discovery.write().await.take() {
      discovery.stop().await.map_err(|e| {
        let err_msg = format!("停止 MdnsDiscovery 失败: {}", e);
        info!("❌ {}", err_msg);
        err_msg
      })?;
      info!("✅ MdnsDiscovery 已停止");
    } else {
      info!("ℹ️  没有运行中的 MdnsDiscovery 需要停止");
    }

    Ok::<(), String>(())
  })
  .await;

  match stop_result {
    Ok(Ok(())) => {
      info!("✅ Step 1 完成: MdnsDiscovery 已正常停止");
    }
    Ok(Err(e)) => {
      let err_msg = format!("Step 1 失败: 停止 MdnsDiscovery 时出错: {}", e);
      info!("⚠️ {}", err_msg);
      info!("⚠️  继续执行后续清理步骤...");
      // 即使出错，也继续清理资源
      let _ = state.inner().discovery.write().await.take();
    }
    Err(_) => {
      let timeout_msg = "Step 1 超时: 停止 MdnsDiscovery 超时（60秒）";
      let detailed_msg = format!(
        "{} - 可能原因：1) discovery.stop() 操作耗时过长 2) 资源未及时释放 3) 网络或系统延迟 4) 任务无法正常终止",
        timeout_msg
      );
      info!("⚠️ {}", detailed_msg);
      info!("⚠️  强制清理 MdnsDiscovery 并继续执行后续步骤...");
      // 即使超时，也清理资源
      let _ = state.inner().discovery.write().await.take();
    }
  }

  // 步骤2: 清理 TCP listener（这会触发文件接收任务检测到 listener 不存在并退出循环）
  info!("🔹 Step 2: 清理 TCP Listener...");

  // 先尝试获取读锁检查状态（带超时）
  info!("  → 检查 TCP Listener 状态...");
  let check_result = tokio::time::timeout(
    tokio::time::Duration::from_secs(2),
    state.inner().tcp_listener.read(),
  )
  .await;

  match check_result {
    Ok(guard) => {
      let has_listener = guard.is_some();
      drop(guard);
      if has_listener {
        info!("  → TCP Listener 存在，尝试获取写锁清理...");
      } else {
        info!("  → TCP Listener 不存在，无需清理");
      }
    }
    Err(_) => {
      info!("  ⚠️  检查 TCP Listener 状态超时（2秒），可能被文件接收任务持有读锁");
      info!("  → 继续尝试获取写锁...");
    }
  }

  // 尝试获取写锁（带超时），如果文件接收任务正在阻塞等待连接，这里可能会超时
  info!("  → 尝试获取写锁（超时时间：5秒）...");
  let write_result = tokio::time::timeout(
    tokio::time::Duration::from_secs(5),
    state.inner().tcp_listener.write(),
  )
  .await;

  match write_result {
    Ok(mut guard) => {
      let tcp_listener_result = guard.take();
      drop(guard);
      if tcp_listener_result.is_some() {
        info!("✅ TCP Listener 已清理（文件接收任务将检测到并退出）");
      } else {
        info!("ℹ️  没有运行中的 TCP Listener 需要清理");
      }
    }
    Err(_) => {
      let timeout_msg = "⚠️  获取 TCP Listener 写锁超时（5秒）";
      let detailed_msg = format!(
        "{} - 原因分析：文件接收任务可能正在阻塞等待连接（accept()），持有读锁无法释放",
        timeout_msg
      );
      info!("{}", detailed_msg);
      info!("⚠️  强制继续：文件接收任务会在下次循环时检测到 listener 为 None 并退出");
      // 注意：这里无法获取写锁，但我们可以继续，因为文件接收任务会在下次循环时检测到 listener 为 None
    }
  }

  // 步骤3: 等待文件接收任务退出
  info!("🔹 Step 3: 等待文件接收任务退出（最多等待500ms）...");
  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
  info!("✅ 已等待文件接收任务退出");

  info!("========== ✅ 服务已完全停止 ==========");
  Ok(())
}

/// 获取已发现的设备列表
#[tauri::command]
pub async fn get_devices(state: State<'_, AppState>) -> Result<Vec<DeviceInfo>, String> {
  if let Some(ref discovery) = *state.inner().discovery.read().await {
    Ok(discovery.get_devices().await)
  } else {
    Ok(vec![])
  }
}

/// 手动添加设备
#[tauri::command]
pub async fn add_device(device: DeviceInfo, state: State<'_, AppState>) -> Result<(), String> {
  // 如果服务未启动，创建一个临时的 discovery 实例来存储设备
  let mut discovery_guard = state.inner().discovery.write().await;
  if discovery_guard.is_none() {
    // 创建一个临时的 discovery 实例（使用默认端口，但不启动服务）
    let mut temp_discovery = MdnsDiscovery::new(8081);
    temp_discovery.set_device_type("mobile".to_string());
    *discovery_guard = Some(temp_discovery);
  }

  if let Some(ref discovery) = *discovery_guard {
    discovery.add_device(device).await;
    Ok(())
  } else {
    Err("Failed to create device storage".to_string())
  }
}

/// 删除设备
#[tauri::command]
pub async fn remove_device(device_id: String, state: State<'_, AppState>) -> Result<(), String> {
  let discovery_guard = state.inner().discovery.read().await;
  if let Some(ref discovery) = *discovery_guard {
    discovery
      .remove_device(&device_id)
      .await
      .map_err(|e| e.to_string())
  } else {
    Err("Service not started".to_string())
  }
}

/// 更新设备信息
#[tauri::command]
pub async fn update_device(device: DeviceInfo, state: State<'_, AppState>) -> Result<(), String> {
  let discovery_guard = state.inner().discovery.read().await;
  if let Some(ref discovery) = *discovery_guard {
    discovery
      .update_device(device)
      .await
      .map_err(|e| e.to_string())
  } else {
    Err("Service not started".to_string())
  }
}

/// 获取设备 ID
#[tauri::command]
pub async fn get_device_id(state: State<'_, AppState>) -> Result<String, String> {
  if let Some(ref discovery) = *state.inner().discovery.read().await {
    Ok(discovery.device_id().to_string())
  } else {
    Err("Service not started".to_string())
  }
}

/// 获取本地 IP 地址
#[tauri::command]
pub async fn get_local_ip(state: State<'_, AppState>) -> Result<String, String> {
  use std::net::UdpSocket;

  // 首先尝试从设备发现中获取实际使用的 IP 地址
  // 如果设备发现已启动，可以从 socket 获取实际可连接的 IP
  if let Some(ref discovery) = *state.inner().discovery.read().await {
    if let Some(ip) = discovery.get_local_ip().await {
      // 如果获取到的 IP 不是 10.0.2.15（模拟器内部 IP），使用这个地址
      if ip != "10.0.2.15" && ip != "0.0.0.0" {
        return Ok(ip);
      }
    }
  }

  // 默认方法：通过连接到一个远程地址来获取本地 IP
  let socket =
    UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Failed to create socket: {}", e))?;

  // 在 Android 模拟器上，尝试连接到局域网地址来获取实际 IP
  // 先尝试连接到常见的局域网网关
  let gateway_ips = vec!["192.168.1.1:80", "192.168.0.1:80", "10.0.2.2:80"];
  for gateway in gateway_ips {
    if let Ok(test_socket) = UdpSocket::bind("0.0.0.0:0") {
      if test_socket.connect(gateway).is_ok() {
        if let Ok(addr) = test_socket.local_addr() {
          let ip = addr.ip();
          // 如果不是回环地址和 10.0.2.15（模拟器内部 IP），使用这个地址
          if !ip.is_loopback() && ip.to_string() != "10.0.2.15" && ip.to_string() != "0.0.0.0" {
            return Ok(ip.to_string());
          }
        }
      }
    }
  }

  // 连接到 Google DNS（不会实际连接，只是用来确定路由）
  socket
    .connect("8.8.8.8:80")
    .map_err(|e| format!("Failed to connect: {}", e))?;

  let local_addr = socket
    .local_addr()
    .map_err(|e| format!("Failed to get local address: {}", e))?;

  let detected_ip = local_addr.ip().to_string();

  // 如果检测到是模拟器环境（IP 是 10.0.2.15），返回 localhost
  // 这样桌面端可以通过 localhost 或 10.0.2.2 连接到模拟器
  // 注意：需要配合 adb port forwarding 使用
  if detected_ip == "10.0.2.15" {
    // 在模拟器环境中，返回 localhost，提示用户使用端口转发
    return Ok("127.0.0.1".to_string());
  }

  Ok(detected_ip)
}

/// 测试与目标设备的连接
#[tauri::command]
pub async fn test_connection(target_address: String, target_port: u16) -> Result<String, String> {
  use stationuli_core::p2p::tcp::TcpConnection;
  use tokio::time::{Duration, timeout};
  use tracing::info;

  // 验证地址
  let address = target_address.trim();
  if address.is_empty() {
    let err_msg = "连接失败: IP 地址不能为空".to_string();
    info!("[MOBILE] {}", err_msg);
    return Err(err_msg);
  }

  info!("[MOBILE] Testing connection to {}:{}", address, target_port);

  // 尝试连接，设置5秒超时
  match timeout(
    Duration::from_secs(5),
    TcpConnection::connect(address, target_port),
  )
  .await
  {
    Ok(Ok(mut conn)) => {
      // 连接成功，立即关闭
      conn.close().ok();
      let msg = format!("连接成功: {}:{}", address, target_port);
      info!("[MOBILE] {}", msg);
      Ok(msg)
    }
    Ok(Err(e)) => {
      let err_msg = format!("连接失败: {}", e);
      info!("[MOBILE] {} to {}:{}", err_msg, address, target_port);
      Err(err_msg)
    }
    Err(_) => {
      let err_msg = format!("连接超时（5秒）: {}:{}", address, target_port);
      info!("[MOBILE] {}", err_msg);
      Err(err_msg)
    }
  }
}
