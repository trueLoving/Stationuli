// 主入口文件 - 移动端 Tauri 应用

mod api;
mod discovery;
mod file_ops;
mod logging;
mod state;

use state::AppState;
use tauri::Manager;

// 导入 API 命令
use api::device::{
  add_device, get_device_id, get_devices, get_local_ip, remove_device, start_discovery,
  stop_discovery, test_connection, update_device,
};
use api::file::{
  get_file_name, get_file_size, save_received_file, select_file_android, select_file_android_v2,
  send_file, send_file_streaming,
};
use api::projection::{
  start_projection, start_receiving_projection, stop_projection, stop_receiving_projection,
};
use logging::init_logging_to_ui;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_android_fs::init());

  builder
    .setup(|app| {
      // 初始化状态
      app.manage(AppState::new());

      // 初始化自定义日志层，将日志发送到前端
      init_logging_to_ui(app.handle(), "mobile")?;

      // 初始化核心库
      stationuli_core::init("mobile").map_err(|e| format!("Failed to init core: {}", e))?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // 设备相关 API（对应前端 src/api/device.ts）
      start_discovery,
      stop_discovery,
      get_devices,
      add_device,
      remove_device,
      update_device,
      get_device_id,
      get_local_ip,
      test_connection,
      // 文件相关 API（对应前端 src/api/file.ts）
      send_file,
      send_file_streaming,
      get_file_size,
      get_file_name,
      save_received_file,
      select_file_android,
      select_file_android_v2,
      // 投影相关 API（对应前端 src/api/projection.ts）
      start_projection,
      stop_projection,
      start_receiving_projection,
      stop_receiving_projection,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
