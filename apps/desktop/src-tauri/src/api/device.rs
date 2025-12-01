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
  // 先停止旧的服务和 TCP listener（如果存在）
  if let Some(mut discovery) = state.inner().discovery.write().await.take() {
    discovery
      .stop()
      .map_err(|e| format!("Failed to stop old service: {}", e))?;
    // 等待任务完全停止
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
  }
  // 清理 TCP listener（这会触发文件接收任务检测到 listener 不存在并退出循环）
  let _ = state.inner().tcp_listener.write().await.take();

  // 等待更长时间，确保资源完全释放
  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 启动新的服务（只获取本地IP，不启动自动发现）
  let mut discovery = MdnsDiscovery::new(port);
  discovery.set_device_type("desktop".to_string());
  discovery
    .start()
    .await
    .map_err(|e| format!("Failed to start service: {}", e))?;

  *state.inner().discovery.write().await = Some(discovery);

  // 启动 TCP 服务器监听文件接收
  let listener = TcpConnection::listen(port)
    .await
    .map_err(|e| format!("Failed to start TCP listener: {}", e))?;

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
  // 停止服务
  if let Some(mut discovery) = state.inner().discovery.write().await.take() {
    discovery
      .stop()
      .map_err(|e| format!("Failed to stop: {}", e))?;
  }
  // 清理 TCP listener
  let _ = state.inner().tcp_listener.write().await.take();
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
    let mut temp_discovery = MdnsDiscovery::new(8080);
    temp_discovery.set_device_type("desktop".to_string());
    *discovery_guard = Some(temp_discovery);
  }

  if let Some(ref discovery) = *discovery_guard {
    discovery.add_device(device).await;
    Ok(())
  } else {
    Err("Failed to create device storage".to_string())
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
      if ip != "0.0.0.0" {
        return Ok(ip);
      }
    }
  }

  // 默认方法：通过连接到一个远程地址来获取本地 IP
  let socket =
    UdpSocket::bind("0.0.0.0:0").map_err(|e| format!("Failed to create socket: {}", e))?;

  // 连接到 Google DNS（不会实际连接，只是用来确定路由）
  socket
    .connect("8.8.8.8:80")
    .map_err(|e| format!("Failed to connect: {}", e))?;

  let local_addr = socket
    .local_addr()
    .map_err(|e| format!("Failed to get local address: {}", e))?;

  Ok(local_addr.ip().to_string())
}

/// 测试与目标设备的连接
#[tauri::command]
pub async fn test_connection(target_address: String, target_port: u16) -> Result<String, String> {
  use stationuli_core::p2p::tcp::TcpConnection;
  use tokio::time::{Duration, timeout};
  use tracing::info;

  info!(
    "[DESKTOP] Testing connection to {}:{}",
    target_address, target_port
  );

  // 尝试连接，设置5秒超时
  match timeout(
    Duration::from_secs(5),
    TcpConnection::connect(&target_address, target_port),
  )
  .await
  {
    Ok(Ok(mut conn)) => {
      // 连接成功，立即关闭
      conn.close().ok();
      let msg = format!("连接成功: {}:{}", target_address, target_port);
      info!("[DESKTOP] {}", msg);
      Ok(msg)
    }
    Ok(Err(e)) => {
      let err_msg = format!("连接失败: {}", e);
      info!(
        "[DESKTOP] {} to {}:{}",
        err_msg, target_address, target_port
      );
      Err(err_msg)
    }
    Err(_) => {
      let err_msg = "连接超时（5秒）".to_string();
      info!(
        "[DESKTOP] {} to {}:{}",
        err_msg, target_address, target_port
      );
      Err(err_msg)
    }
  }
}
