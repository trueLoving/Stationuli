// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use stationuli_core::file::transfer::FileTransfer;
use stationuli_core::p2p::mdns::{DeviceInfo, MdnsDiscovery};
use stationuli_core::p2p::tcp::TcpConnection;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::RwLock;

// 全局状态
pub struct AppState {
  discovery: Arc<RwLock<Option<MdnsDiscovery>>>,
  file_transfer: Arc<RwLock<FileTransfer>>,
  tcp_listener: Arc<RwLock<Option<tokio::net::TcpListener>>>,
}

#[tauri::command]
async fn start_discovery(
  port: u16,
  state: tauri::State<'_, AppState>,
  app: tauri::AppHandle,
) -> Result<String, String> {
  let mut discovery = MdnsDiscovery::new(port);
  discovery
    .start()
    .await
    .map_err(|e| format!("Failed to start discovery: {}", e))?;

  *state.discovery.write().await = Some(discovery);

  // 启动 TCP 服务器监听文件接收
  let listener = TcpConnection::listen(port)
    .await
    .map_err(|e| format!("Failed to start TCP listener: {}", e))?;

  *state.tcp_listener.write().await = Some(listener);

  // 启动文件接收任务
  let listener_clone = state.tcp_listener.clone();
  let transfer_clone = state.file_transfer.clone();
  let app_clone = app.clone();

  tokio::spawn(async move {
    loop {
      if let Some(listener) = listener_clone.read().await.as_ref() {
        let transfer = transfer_clone.read().await;
        let save_dir = app_clone
          .path()
          .app_data_dir()
          .unwrap()
          .join("received_files");

        // 确保目录存在
        if let Err(e) = std::fs::create_dir_all(&save_dir) {
          eprintln!("Failed to create save directory: {}", e);
          tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          continue;
        }

        // receive_file 现在可以接受目录路径，会自动使用接收到的文件名
        if let Err(e) = transfer
          .receive_file(
            save_dir.to_str().unwrap_or("/tmp/stationuli_received"),
            listener,
          )
          .await
        {
          eprintln!("File receive error: {}", e);
        }
      }
      tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
  });

  Ok("Discovery started".to_string())
}

#[tauri::command]
async fn stop_discovery(state: tauri::State<'_, AppState>) -> Result<(), String> {
  if let Some(mut discovery) = state.discovery.write().await.take() {
    discovery
      .stop()
      .map_err(|e| format!("Failed to stop: {}", e))?;
  }
  Ok(())
}

#[tauri::command]
async fn get_devices(state: tauri::State<'_, AppState>) -> Result<Vec<DeviceInfo>, String> {
  if let Some(ref discovery) = *state.discovery.read().await {
    Ok(discovery.get_devices().await)
  } else {
    Ok(vec![])
  }
}

#[tauri::command]
async fn add_device(device: DeviceInfo, state: tauri::State<'_, AppState>) -> Result<(), String> {
  if let Some(ref discovery) = *state.discovery.read().await {
    discovery.add_device(device).await;
    Ok(())
  } else {
    Err("Discovery not started".to_string())
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
  let transfer = state.file_transfer.read().await;
  let app_clone = app.clone();
  let file_path_clone = file_path.clone();

  // 使用进度回调发送进度更新
  transfer
    .send_file_with_progress(
      &file_path,
      &target_address,
      target_port,
      Some(move |sent_bytes, total_bytes| {
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
      }),
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
  if let Some(ref discovery) = *state.discovery.read().await {
    Ok(discovery.device_id().to_string())
  } else {
    Err("Discovery not started".to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      // 初始化状态
      app.manage(AppState {
        discovery: Arc::new(RwLock::new(None)),
        file_transfer: Arc::new(RwLock::new(FileTransfer::new())),
        tcp_listener: Arc::new(RwLock::new(None)),
      });

      // 初始化核心库
      stationuli_core::init().map_err(|e| format!("Failed to init core: {}", e))?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      start_discovery,
      stop_discovery,
      get_devices,
      add_device,
      send_file,
      get_device_id
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
