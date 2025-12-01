// 设备发现服务实现（内部模块）

use tauri::{AppHandle, Emitter, Manager};

/// 启动文件接收任务
pub fn start_file_receiver_task(
  listener: std::sync::Arc<tokio::sync::RwLock<Option<tokio::net::TcpListener>>>,
  transfer: std::sync::Arc<tokio::sync::RwLock<stationuli_core::file::transfer::FileTransfer>>,
  app: AppHandle,
) {
  tokio::spawn(async move {
    loop {
      // 检查 listener 是否存在
      let listener_guard = listener.read().await;
      if let Some(listener) = listener_guard.as_ref() {
        let transfer_guard = transfer.read().await;
        // 移动端使用应用数据目录保存接收的文件
        let save_dir = app.path().app_data_dir().unwrap().join("received_files");

        // 确保目录存在
        if let Err(e) = std::fs::create_dir_all(&save_dir) {
          eprintln!("Failed to create save directory: {}", e);
          drop(listener_guard);
          tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          continue;
        }

        // receive_file 现在可以接受目录路径，会自动使用接收到的文件名
        // 注意：在 receive_file 调用期间，listener_guard 会被持有
        match transfer_guard
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
            let _ = app.emit(
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
}
