// 文件相关 API 命令 - 对应前端 src/api/file.ts

use crate::state::AppState;
use tauri::{AppHandle, State};

/// 发送文件
#[tauri::command]
pub async fn send_file(
  file_path: String,
  target_address: String,
  target_port: u16,
  state: State<'_, AppState>,
  app: AppHandle,
) -> Result<String, String> {
  use tokio::time::Instant;
  use tracing::info;

  // 获取文件大小
  let file_size = tokio::fs::metadata(&file_path)
    .await
    .map_err(|e| format!("Failed to get file metadata: {}", e))?
    .len();

  let start_time = Instant::now();

  let transfer = state.inner().file_transfer.read().await;
  let app_clone = app.clone();
  let file_path_clone = file_path.clone();

  // 使用进度回调发送进度更新
  let result = transfer
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
    .await;

  result.map_err(|e| format!("Failed to send file: {}", e))?;

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

/// 获取文件大小
#[tauri::command]
pub async fn get_file_size(file_path: String) -> Result<u64, String> {
  use std::path::Path;
  use tokio::fs;

  let path = Path::new(&file_path);
  let metadata = fs::metadata(path)
    .await
    .map_err(|e| format!("Failed to get file metadata: {}", e))?;

  Ok(metadata.len())
}

/// 保存接收的文件到用户指定的位置
#[tauri::command]
pub async fn save_received_file(
  file_path: String,
  file_name: String,
  app: AppHandle,
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
