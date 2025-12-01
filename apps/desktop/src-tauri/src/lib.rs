// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use stationuli_core::file::transfer::FileTransfer;
use stationuli_core::p2p::mdns::{DeviceInfo, MdnsDiscovery};
use stationuli_core::p2p::tcp::TcpConnection;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;
use tracing_subscriber::{filter::EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

// 全局状态
pub struct AppState {
  discovery: Arc<RwLock<Option<MdnsDiscovery>>>,
  file_transfer: Arc<RwLock<FileTransfer>>,
  tcp_listener: Arc<RwLock<Option<tokio::net::TcpListener>>>,
}

/// 初始化日志系统，将日志发送到前端界面
fn init_logging_to_ui(app: &tauri::AppHandle, device_type: &str) -> Result<(), String> {
  use std::sync::Arc;

  let app_handle = Arc::new(app.clone());
  let device_type = device_type.to_string();

  // 创建自定义 writer，使用闭包
  let app_clone = app_handle.clone();
  let device_type_clone = device_type.clone();

  let writer = move || UiLogWriter {
    app: app_clone.clone(),
    device_type: device_type_clone.clone(),
    buffer: Vec::new(),
  };

  let ui_layer = fmt::layer()
    .with_target(false)
    .with_thread_ids(false)
    .with_file(false)
    .with_line_number(false)
    .with_writer(writer);

  // 设置日志级别
  let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

  // 初始化订阅者
  tracing_subscriber::registry()
    .with(filter)
    .with(ui_layer)
    .init();

  Ok(())
}

/// 自定义日志写入器，将日志通过 Tauri 事件发送到前端
struct UiLogWriter {
  app: Arc<tauri::AppHandle>,
  device_type: String,
  buffer: Vec<u8>,
}

impl std::io::Write for UiLogWriter {
  fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
    self.buffer.extend_from_slice(buf);

    // 检查是否有完整的行（以换行符结尾）
    while let Some(newline_pos) = self.buffer.iter().position(|&b| b == b'\n') {
      let line: Vec<u8> = self.buffer.drain(..=newline_pos).collect();
      if let Ok(message) = std::str::from_utf8(&line[..line.len().saturating_sub(1)]) {
        let trimmed = message.trim();
        if !trimmed.is_empty() {
          let log_message = format!("[{}] {}", self.device_type.to_uppercase(), trimmed);
          let _ = self.app.emit("log-message", log_message);
        }
      }
    }

    Ok(buf.len())
  }

  fn flush(&mut self) -> std::io::Result<()> {
    // 处理剩余的缓冲区内容
    if !self.buffer.is_empty() {
      if let Ok(message) = std::str::from_utf8(&self.buffer) {
        let trimmed = message.trim();
        if !trimmed.is_empty() {
          let log_message = format!("[{}] {}", self.device_type.to_uppercase(), trimmed);
          let _ = self.app.emit("log-message", log_message);
        }
      }
      self.buffer.clear();
    }
    Ok(())
  }
}

#[tauri::command]
async fn start_discovery(
  port: u16,
  state: tauri::State<'_, AppState>,
  app: tauri::AppHandle,
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
  let listener_clone = state.inner().tcp_listener.clone();
  let transfer_clone = state.inner().file_transfer.clone();
  let app_clone = app.clone();

  tokio::spawn(async move {
    loop {
      // 检查 listener 是否存在
      let listener_guard = listener_clone.read().await;
      if let Some(listener) = listener_guard.as_ref() {
        let transfer = transfer_clone.read().await;
        let save_dir = app_clone
          .path()
          .app_data_dir()
          .unwrap()
          .join("received_files");

        // 确保目录存在
        if let Err(e) = std::fs::create_dir_all(&save_dir) {
          eprintln!("Failed to create save directory: {}", e);
          drop(listener_guard);
          tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          continue;
        }

        // receive_file 现在可以接受目录路径，会自动使用接收到的文件名
        // 注意：在 receive_file 调用期间，listener_guard 会被持有
        match transfer
          .receive_file(
            save_dir.to_str().unwrap_or("/tmp/stationuli_received"),
            listener,
          )
          .await
        {
          Ok(file_path) => {
            // 文件接收成功，发送事件通知前端
            let file_name = std::path::Path::new(&file_path)
              .file_name()
              .and_then(|n| n.to_str())
              .unwrap_or("unknown")
              .to_string();
            drop(listener_guard);
            let _ = app_clone.emit(
              "file-received",
              serde_json::json!({
                "file_path": file_path,
                "file_name": file_name
              }),
            );
          }
          Err(e) => {
            eprintln!("File receive error: {}", e);
            drop(listener_guard);
            // 如果连接被关闭或出错，等待一小段时间后继续
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          }
        }
      } else {
        drop(listener_guard);
        // 如果没有 listener，等待一段时间后重试
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
      }
    }
  });

  Ok("Service started".to_string())
}

#[tauri::command]
async fn stop_discovery(state: tauri::State<'_, AppState>) -> Result<(), String> {
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

#[tauri::command]
async fn get_devices(state: tauri::State<'_, AppState>) -> Result<Vec<DeviceInfo>, String> {
  if let Some(ref discovery) = *state.inner().discovery.read().await {
    Ok(discovery.get_devices().await)
  } else {
    Ok(vec![])
  }
}

#[tauri::command]
async fn add_device(device: DeviceInfo, state: tauri::State<'_, AppState>) -> Result<(), String> {
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

#[tauri::command]
async fn send_file(
  file_path: String,
  target_address: String,
  target_port: u16,
  state: tauri::State<'_, AppState>,
  app: tauri::AppHandle,
) -> Result<String, String> {
  let transfer = state.inner().file_transfer.read().await;
  let app_clone = app.clone();
  let file_path_clone = file_path.clone();

  // 使用进度回调发送进度更新
  transfer
    .send_file_with_progress(
      &file_path,
      &target_address,
      target_port,
      Some(Box::new(move |sent_bytes, total_bytes| {
        let progress = if total_bytes > 0 {
          (sent_bytes * 100 / total_bytes) as u32
        } else {
          0
        };
        app_clone
          .emit(
            "transfer-progress",
            serde_json::json!({
              "file": file_path_clone.clone(),
              "progress": progress,
              "sent": sent_bytes,
              "total": total_bytes
            }),
          )
          .ok();
      })),
    )
    .await
    .map_err(|e| format!("Failed to send file: {}", e))?;

  app
    .emit(
      "transfer-complete",
      serde_json::json!({
        "file": file_path
      }),
    )
    .map_err(|e| format!("Failed to emit event: {}", e))?;

  Ok("File sent successfully".to_string())
}

#[tauri::command]
async fn get_device_id(state: tauri::State<'_, AppState>) -> Result<String, String> {
  if let Some(ref discovery) = *state.inner().discovery.read().await {
    Ok(discovery.device_id().to_string())
  } else {
    Err("Service not started".to_string())
  }
}

#[tauri::command]
async fn get_local_ip(state: tauri::State<'_, AppState>) -> Result<String, String> {
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
async fn test_connection(target_address: String, target_port: u16) -> Result<String, String> {
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

/// 保存接收的文件到用户指定的位置
#[tauri::command]
async fn save_received_file(
  file_path: String,
  file_name: String,
  app: tauri::AppHandle,
) -> Result<String, String> {
  use tauri_plugin_dialog::DialogExt;
  use tracing::info;

  info!("[DESKTOP] Saving file: {} (from: {})", file_name, file_path);

  // 读取源文件
  info!("[DESKTOP] Reading source file from: {}", file_path);
  let file_data = tokio::fs::read(&file_path)
    .await
    .map_err(|e| format!("Failed to read source file: {} (path: {})", e, file_path))?;

  info!(
    "[DESKTOP] File read successfully, size: {} bytes",
    file_data.len()
  );

  // 使用 Tauri dialog 插件打开保存对话框
  // 在异步函数中使用 spawn_blocking 来运行阻塞的对话框操作
  let save_path_opt = tokio::task::spawn_blocking({
    let app_clone = app.clone();
    move || app_clone.dialog().file().blocking_save_file()
  })
  .await
  .map_err(|e| format!("Failed to show save dialog: {}", e))?;

  // FilePath 是一个枚举，需要转换为 PathBuf
  use std::path::PathBuf;
  use tauri_plugin_dialog::FilePath;

  let save_path: PathBuf = match save_path_opt {
    Some(FilePath::Path(path_buf)) => path_buf,
    Some(FilePath::Url(url)) => {
      // 如果是 file:// URL，尝试转换为路径
      if url.scheme() == "file" {
        url
          .to_file_path()
          .map_err(|_| "无法将 URL 转换为文件路径".to_string())?
      } else {
        return Err(format!("不支持的 URL 方案: {}", url.scheme()));
      }
    }
    None => return Err("用户取消了保存".to_string()),
  };

  // 写入文件
  tokio::fs::write(&save_path, &file_data)
    .await
    .map_err(|e| format!("Failed to write file: {}", e))?;

  info!(
    "[DESKTOP] File saved successfully to: {}",
    save_path.display()
  );
  Ok(format!("文件已保存到: {}", save_path.display()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      // 初始化状态
      app.manage(AppState {
        discovery: Arc::new(RwLock::new(None)),
        file_transfer: Arc::new(RwLock::new(FileTransfer::new())),
        tcp_listener: Arc::new(RwLock::new(None)),
      });

      // 初始化自定义日志层，将日志发送到前端
      init_logging_to_ui(app.handle(), "desktop")?;

      // 初始化核心库
      stationuli_core::init("desktop").map_err(|e| format!("Failed to init core: {}", e))?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      start_discovery,
      stop_discovery,
      get_devices,
      add_device,
      send_file,
      get_device_id,
      get_local_ip,
      test_connection,
      save_received_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
