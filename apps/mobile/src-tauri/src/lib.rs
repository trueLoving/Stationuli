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

/// 从 content:// URI 中尝试提取文件名（后备方法）
fn get_file_name_from_uri(uri: &str) -> String {
  let uri_str = uri;

  // 如果 URI 包含文件名（通常在路径的最后部分）
  if let Some(last_part) = uri_str.split('/').last() {
    // 检查是否包含文件扩展名
    if last_part.contains('.') && !last_part.starts_with("msf:") {
      // 可能是文件名，尝试解码
      if let Ok(decoded) = urlencoding::decode(last_part) {
        let decoded_str = decoded.to_string();
        // 如果解码后的字符串看起来像文件名（包含扩展名且不太长）
        if decoded_str.len() < 200 && decoded_str.contains('.') {
          return decoded_str;
        }
      }
    }
  }

  // 如果无法从 URI 提取，尝试从 URI 中推断文件扩展名
  let uri_lower = uri_str.to_lowercase();
  let extension = if uri_lower.contains(".png") {
    "png"
  } else if uri_lower.contains(".jpg") || uri_lower.contains(".jpeg") {
    "jpg"
  } else if uri_lower.contains(".pdf") {
    "pdf"
  } else if uri_lower.contains(".mp4") {
    "mp4"
  } else if uri_lower.contains(".mp3") {
    "mp3"
  } else if uri_lower.contains(".txt") {
    "txt"
  } else if uri_lower.contains(".doc") || uri_lower.contains(".docx") {
    "docx"
  } else if uri_lower.contains(".xls") || uri_lower.contains(".xlsx") {
    "xlsx"
  } else {
    "bin"
  };

  // 返回一个描述性的文件名（作为最后的后备方案）
  format!("文件.{}", extension)
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

  // 设置日志级别 - 移动端只显示关键信息
  // 过滤掉频繁的广播消息和调试信息
  let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
    // 默认：显示 warn、error 和关键模块的 info
    // 使用更精确的过滤规则
    EnvFilter::new("warn")
        // 允许 mdns 模块的 info 级别日志（但会过滤掉频繁的广播消息）
        .add_directive("stationuli_core::p2p::mdns=info".parse().unwrap())
        // 允许文件传输模块的 info 级别日志
        .add_directive("stationuli_core::file=info".parse().unwrap())
        // 允许移动端应用本身的 info 级别日志
        .add_directive("stationuli_mobile=info".parse().unwrap())
  });

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
  use tracing::info;

  info!("🚀 启动服务 (端口: {})", port);

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
  discovery.set_device_type("mobile".to_string());
  discovery
    .start()
    .await
    .map_err(|e| format!("Failed to start service: {}", e))?;

  *state.inner().discovery.write().await = Some(discovery);

  // 启动 TCP 服务器监听文件接收
  info!("📡 TCP 监听器启动中 (端口: {})...", port);
  let listener = TcpConnection::listen(port).await.map_err(|e| {
    let err_msg = format!("Failed to start TCP listener on port {}: {}", port, e);
    info!("{}", err_msg);
    err_msg
  })?;

  info!("✅ TCP 监听器已启动 (端口: {})", port);
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
        // 移动端使用应用数据目录保存接收的文件
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
            save_dir
              .to_str()
              .unwrap_or("/data/data/com.stationuli.mobile/files/received"),
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

#[tauri::command]
async fn send_file(
  file_path: String,
  target_address: String,
  target_port: u16,
  _state: tauri::State<'_, AppState>,
  app: tauri::AppHandle,
) -> Result<String, String> {
  // 在 Android 上，如果文件路径是 content:// URI，需要特殊处理
  // 同时获取文件数据和文件名
  let (file_data, file_name) = if file_path.starts_with("content://") {
    #[cfg(target_os = "android")]
    {
      use std::io::Read;
      use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
      // 在 23.0.1 版本中，使用 android_fs_async() 和 open_file_readable
      let api = app.android_fs_async();
      // FileUri::from_json_str 需要 JSON 格式：{"uri": "...", "documentTopTreeUri": null}
      let json_str = format!(r#"{{"uri": "{}", "documentTopTreeUri": null}}"#, file_path);
      let file_uri = FileUri::from_json_str(&json_str)
        .map_err(|e| format!("Failed to parse URI: {} (URI: {})", e, file_path))?;

      // 先获取文件名（在读取文件之前）
      let name = api
        .get_name(&file_uri)
        .await
        .ok()
        .and_then(|n| if !n.is_empty() { Some(n) } else { None })
        .unwrap_or_else(|| get_file_name_from_uri(&file_path));

      // 然后读取文件内容
      let mut file = api
        .open_file_readable(&file_uri)
        .await
        .map_err(|e| format!("Failed to read file from URI: {} (URI: {})", e, file_path))?;
      let mut contents = Vec::new();
      file
        .read_to_end(&mut contents)
        .map_err(|e| format!("Failed to read file contents: {}", e))?;

      (contents, name)
    }
    #[cfg(not(target_os = "android"))]
    {
      return Err("Content URI is only supported on Android".to_string());
    }
  } else {
    // 普通文件路径，直接读取
    let data = tokio::fs::read(&file_path)
      .await
      .map_err(|e| format!("Failed to read file: {}", e))?;
    let name = std::path::Path::new(&file_path)
      .file_name()
      .and_then(|n| n.to_str())
      .unwrap_or("file")
      .to_string();
    (data, name)
  };

  let file_size = file_data.len() as u64;
  let chunk_size = 1024 * 1024; // 1MB per chunk
  let total_chunks = (file_size as usize + chunk_size - 1) / chunk_size;

  // 建立连接
  use stationuli_core::p2p::tcp::TcpConnection;
  let mut connection = TcpConnection::connect(&target_address, target_port)
    .await
    .map_err(|e| format!("Failed to connect: {}", e))?;

  // 发送开始传输消息
  use stationuli_core::file::transfer::TransferMessage;
  let start_msg = TransferMessage::StartTransfer {
    file_name: file_name.clone(),
    file_size,
    total_chunks: total_chunks as u64,
  };
  let start_data =
    serde_json::to_vec(&start_msg).map_err(|e| format!("Serialize failed: {}", e))?;
  connection
    .send(&start_data)
    .await
    .map_err(|e| format!("Failed to send start message: {}", e))?;

  // 分片并发送文件
  let app_clone = app.clone();
  let file_path_clone = file_path.clone();
  let mut sent_bytes = 0u64;

  for (i, chunk_data) in file_data.chunks(chunk_size).enumerate() {
    let chunk_size_actual = chunk_data.len();
    let chunk_msg = TransferMessage::Chunk {
      chunk_id: i as u64,
      data: chunk_data.to_vec(),
    };
    let chunk_data_serialized =
      serde_json::to_vec(&chunk_msg).map_err(|e| format!("Serialize failed: {}", e))?;
    connection
      .send(&chunk_data_serialized)
      .await
      .map_err(|e| format!("Failed to send chunk: {}", e))?;

    sent_bytes += chunk_size_actual as u64;

    // 发送进度更新
    let progress = if file_size > 0 {
      (sent_bytes * 100 / file_size) as u32
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
          "total": file_size
        }),
      )
      .ok();
  }

  // 发送完成消息
  let complete_msg = TransferMessage::Complete;
  let complete_data =
    serde_json::to_vec(&complete_msg).map_err(|e| format!("Serialize failed: {}", e))?;
  connection
    .send(&complete_data)
    .await
    .map_err(|e| format!("Failed to send complete message: {}", e))?;

  connection
    .close()
    .map_err(|e| format!("Failed to close connection: {}", e))?;

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
    return Ok("localhost".to_string());
  }

  Ok(detected_ip)
}

/// 获取文件大小
#[tauri::command]
async fn get_file_size(
  file_path: String,
  #[allow(unused_variables)] app: tauri::AppHandle,
) -> Result<u64, String> {
  // 在 Android 上，如果文件路径是 content:// URI，需要特殊处理
  if file_path.starts_with("content://") {
    #[cfg(target_os = "android")]
    {
      use std::io::Read;
      use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
      // 在 23.0.1 版本中，使用 android_fs_async()
      let api = app.android_fs_async();
      // FileUri::from_json_str 需要 JSON 格式：{"uri": "...", "documentTopTreeUri": null}
      let json_str = format!(r#"{{"uri": "{}", "documentTopTreeUri": null}}"#, file_path);
      let file_uri =
        FileUri::from_json_str(&json_str).map_err(|e| format!("Failed to parse URI: {}", e))?;
      // 读取文件内容以获取大小
      let mut file = api
        .open_file_readable(&file_uri)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;
      let mut contents = Vec::new();
      file
        .read_to_end(&mut contents)
        .map_err(|e| format!("Failed to read file contents: {}", e))?;

      return Ok(contents.len() as u64);
    }
    #[cfg(not(target_os = "android"))]
    {
      return Err("Content URI is only supported on Android".to_string());
    }
  }

  // 普通文件路径
  use std::path::Path;
  use tokio::fs;

  let path = Path::new(&file_path);
  let metadata = fs::metadata(path)
    .await
    .map_err(|e| format!("Failed to get file metadata: {}", e))?;

  Ok(metadata.len())
}

/// 获取文件名（包含扩展名）
#[tauri::command]
async fn get_file_name(file_path: String, app: tauri::AppHandle) -> Result<String, String> {
  // 在 Android 上，如果文件路径是 content:// URI，需要特殊处理
  if file_path.starts_with("content://") {
    #[cfg(target_os = "android")]
    {
      use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
      let api = app.android_fs_async();

      // 尝试使用 Android FS API 获取文件的显示名称
      let json_str = format!(r#"{{"uri": "{}", "documentTopTreeUri": null}}"#, file_path);
      if let Ok(file_uri) = FileUri::from_json_str(&json_str) {
        // 尝试使用 get_name 方法获取文件名
        if let Ok(file_name) = api.get_name(&file_uri).await {
          if !file_name.is_empty() {
            return Ok(file_name);
          }
        }
      }

      // 如果 API 方法失败，尝试从 URI 中提取文件名
      let uri_str = file_path.as_str();

      // 如果 URI 包含文件名（通常在路径的最后部分）
      if let Some(last_part) = uri_str.split('/').last() {
        // 检查是否包含文件扩展名
        if last_part.contains('.') && !last_part.starts_with("msf:") {
          // 可能是文件名，尝试解码
          if let Ok(decoded) = urlencoding::decode(last_part) {
            let decoded_str = decoded.to_string();
            // 如果解码后的字符串看起来像文件名（包含扩展名且不太长）
            if decoded_str.len() < 200 && decoded_str.contains('.') {
              return Ok(decoded_str);
            }
          }
        }
      }

      // 如果无法从 URI 提取，尝试从 URI 中推断文件扩展名
      let uri_lower = uri_str.to_lowercase();
      let extension = if uri_lower.contains(".png") {
        "png"
      } else if uri_lower.contains(".jpg") || uri_lower.contains(".jpeg") {
        "jpg"
      } else if uri_lower.contains(".pdf") {
        "pdf"
      } else if uri_lower.contains(".mp4") {
        "mp4"
      } else if uri_lower.contains(".mp3") {
        "mp3"
      } else if uri_lower.contains(".txt") {
        "txt"
      } else if uri_lower.contains(".doc") || uri_lower.contains(".docx") {
        "docx"
      } else if uri_lower.contains(".xls") || uri_lower.contains(".xlsx") {
        "xlsx"
      } else {
        "bin"
      };

      // 返回一个描述性的文件名（作为最后的后备方案）
      return Ok(format!("文件.{}", extension));
    }
    #[cfg(not(target_os = "android"))]
    {
      return Err("Content URI is only supported on Android".to_string());
    }
  }

  // 普通文件路径，直接从路径中提取文件名
  use std::path::Path;

  let path = Path::new(&file_path);
  let file_name = path
    .file_name()
    .and_then(|n| n.to_str())
    .map(|s| s.to_string())
    .unwrap_or_else(|| "未知文件".to_string());

  Ok(file_name)
}

/// 保存接收的文件到用户可访问的位置（如下载文件夹）
#[tauri::command]
async fn save_received_file(
  file_path: String,
  file_name: String,
  app: tauri::AppHandle,
) -> Result<String, String> {
  use tracing::info;

  info!("[MOBILE] Saving file: {} (from: {})", file_name, file_path);

  use tauri_plugin_android_fs::AndroidFsExt;
  let api = app.android_fs_async();

  // 读取源文件
  // 接收的文件路径是普通文件系统路径（应用数据目录），不是 content:// URI
  // 直接使用标准文件系统 API 读取
  info!("[MOBILE] Reading source file from: {}", file_path);
  let file_data = tokio::fs::read(&file_path)
    .await
    .map_err(|e| format!("Failed to read source file: {} (path: {})", e, file_path))?;

  info!(
    "[MOBILE] File read successfully, size: {} bytes",
    file_data.len()
  );

  // 在 23.0.1 版本中，使用 file_picker().save_file()
  // save_file 需要 4 个参数：initial_dir, default_name, mime_type, allow_overwrite
  let save_uri_opt = api
    .file_picker()
    .save_file(
      None,       // 初始目录
      &file_name, // 默认文件名
      None,       // MIME 类型（可选）
      false,      // 是否允许覆盖已存在的文件
    )
    .await
    .map_err(|e| format!("Failed to show save dialog: {}", e))?;

  let save_file_uri = save_uri_opt.ok_or_else(|| "用户取消了保存".to_string())?;

  // 使用 write 方法写入文件（23.0.1 API，接受 &FileUri）
  api
    .write(&save_file_uri, &file_data)
    .await
    .map_err(|e| format!("Failed to write file: {}", e))?;

  // FileUri 转换为字符串用于日志和返回消息
  let uri_json = serde_json::to_string(&save_file_uri)
    .map_err(|e| format!("Failed to serialize FileUri: {}", e))?;
  let uri_value: serde_json::Value =
    serde_json::from_str(&uri_json).map_err(|e| format!("Failed to parse FileUri JSON: {}", e))?;
  let save_uri_string = match uri_value {
    serde_json::Value::String(s) => s,
    serde_json::Value::Object(map) => map
      .get("uri")
      .or_else(|| map.get("path"))
      .and_then(|v| v.as_str())
      .map(|s| s.to_string())
      .unwrap_or_else(|| format!("{:?}", save_file_uri)),
    _ => format!("{:?}", save_file_uri),
  };

  info!("[MOBILE] File saved successfully to: {}", save_uri_string);
  Ok(format!("文件已保存到: {}", save_uri_string))
}

/// 在 Android 上选择文件（使用 Android 文件选择器）
/// 返回包含 URI 和文件名的 JSON 对象
#[tauri::command]
async fn select_file_android(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
  use tauri_plugin_android_fs::AndroidFsExt;
  use tracing::info;

  let api = app.android_fs_async();

  info!("[MOBILE] Opening file picker dialog");

  // 在 23.0.1 版本中，使用 file_picker().pick_files()
  // 返回 Vec<FileUri>，需要转换为字符串
  let selected_files = api
    .file_picker()
    .pick_files(
      None,     // 初始目录
      &["*/*"], // 所有文件类型
      false,    // 不允许多选
    )
    .await
    .map_err(|e| format!("Failed to show file picker: {}", e))?;

  if let Some(file_uri) = selected_files.first() {
    // 尝试获取文件名
    let file_name = api.get_name(file_uri).await.ok().unwrap_or_else(|| {
      // 如果无法获取文件名，尝试从 URI 中提取
      "未知文件".to_string()
    });

    // FileUri 需要转换为字符串
    // 使用 serde_json 序列化，然后提取 URI 字符串
    let uri_json =
      serde_json::to_string(file_uri).map_err(|e| format!("Failed to serialize FileUri: {}", e))?;

    let uri_value: serde_json::Value = serde_json::from_str(&uri_json)
      .map_err(|e| format!("Failed to parse FileUri JSON: {}", e))?;

    // 从 JSON 中提取 URI 字符串
    let uri_string = match uri_value {
      serde_json::Value::String(s) => s,
      serde_json::Value::Object(map) => {
        map
          .get("uri")
          .or_else(|| map.get("path"))
          .and_then(|v| v.as_str())
          .map(|s| s.to_string())
          .unwrap_or_else(|| {
            // 如果 JSON 格式不同，从 Debug 格式提取
            let debug_str = format!("{:?}", file_uri);
            if let Some(start) = debug_str.find("content://") {
              let end = debug_str[start..]
                .find(|c: char| c == '"' || c == '\'' || c == ' ' || c == '}')
                .map(|i| start + i)
                .unwrap_or(debug_str.len());
              debug_str[start..end].to_string()
            } else {
              format!("{:?}", file_uri)
            }
          })
      }
      _ => format!("{:?}", file_uri),
    };

    info!(
      "[MOBILE] File selected: {} (name: {})",
      uri_string, file_name
    );

    // 返回包含 URI 和文件名的对象
    Ok(Some(serde_json::json!({
      "uri": uri_string,
      "name": file_name
    })))
  } else {
    info!("[MOBILE] No file selected");
    Ok(None)
  }
}

/// 测试与目标设备的连接
#[tauri::command]
async fn test_connection(target_address: String, target_port: u16) -> Result<String, String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init());

  let builder = builder.plugin(tauri_plugin_android_fs::init());

  builder
    .setup(|app| {
      // 初始化状态
      app.manage(AppState {
        discovery: Arc::new(RwLock::new(None)),
        file_transfer: Arc::new(RwLock::new(FileTransfer::new())),
        tcp_listener: Arc::new(RwLock::new(None)),
      });

      // 初始化自定义日志层，将日志发送到前端
      init_logging_to_ui(app.handle(), "mobile")?;

      // 初始化核心库
      stationuli_core::init("mobile").map_err(|e| format!("Failed to init core: {}", e))?;

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
      get_file_size,
      get_file_name,
      test_connection,
      save_received_file,
      select_file_android
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
