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
      // 使用超时获取读锁，避免长时间阻塞
      let listener_check =
        tokio::time::timeout(tokio::time::Duration::from_millis(100), listener.read()).await;

      let listener_guard = match listener_check {
        Ok(guard) => guard,
        Err(_) => {
          // 获取读锁超时，可能正在被清理，等待后重试
          tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          continue;
        }
      };

      if let Some(listener_ref) = listener_guard.as_ref() {
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

        // 关键改进：使用超时的 receive_file 调用，这样即使没有连接，也会定期返回
        // 超时时间设置为 1 秒，这样可以在停止服务时快速响应
        // 在 receive_file 内部调用 accept() 期间，我们持有读锁，但超时后会释放，让停止服务可以获取写锁
        let receive_timeout = tokio::time::timeout(
          tokio::time::Duration::from_secs(1),
          transfer_guard.receive_file(
            save_dir
              .to_str()
              .unwrap_or("/data/data/com.stationuli.mobile/files/received"),
            listener_ref,
          ),
        )
        .await;

        match receive_timeout {
          Ok(Ok(file_path)) => {
            // 文件接收成功，先释放读锁，然后发送事件
            drop(listener_guard);
            let file_name = std::path::Path::new(&file_path)
              .file_name()
              .and_then(|n| n.to_str())
              .unwrap_or("unknown")
              .to_string();
            let _ = app.emit(
              "file-received",
              serde_json::json!({
                "file_path": file_path,
                "file_name": file_name
              }),
            );
          }
          Ok(Err(e)) => {
            // receive_file 失败
            drop(listener_guard);
            eprintln!("File receive error: {}", e);
            // 如果连接被关闭或出错，等待一小段时间后继续
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
          }
          Err(_) => {
            // receive_file 超时（通常是 accept() 超时），这是正常的
            // 释放读锁后重新检查 listener 是否存在
            drop(listener_guard);
            // 短暂等待后继续循环，检查 listener 是否还存在
            // 这样可以让停止服务时有机会获取写锁
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            continue;
          }
        }
      } else {
        drop(listener_guard);
        // 如果没有 listener，说明服务已停止，退出循环
        // 这样可以避免任务无限运行，并在下次启动时创建新任务
        break;
      }
    }
  });
}
