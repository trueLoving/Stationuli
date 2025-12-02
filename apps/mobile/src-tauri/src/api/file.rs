// 文件相关 API 命令 - 对应前端 src/api/file.ts

#[cfg(target_os = "android")]
use crate::file_ops::get_file_name_from_uri;
use crate::state::AppState;
use stationuli_core::file::transfer::TransferMessage;
use stationuli_core::p2p::tcp::TcpConnection;
use tauri::{AppHandle, Emitter, State};

/// 发送文件
#[tauri::command]
pub async fn send_file(
  file_path: String,
  target_address: String,
  target_port: u16,
  _state: State<'_, AppState>,
  app: AppHandle,
) -> Result<String, String> {
  // 在 Android 上，如果文件路径是 content:// URI，需要特殊处理
  // 同时获取文件数据和文件名
  let (file_data, file_name) = if file_path.starts_with("content://") {
    #[cfg(target_os = "android")]
    {
      use std::io::Read;
      use tauri_plugin_android_fs::{AndroidFsExt, FileUri};
      use tracing::info;

      let api = app.android_fs_async();
      let json_str = format!(r#"{{"uri": "{}", "documentTopTreeUri": null}}"#, file_path);
      let file_uri = FileUri::from_json_str(&json_str)
        .map_err(|e| format!("Failed to parse URI: {} (URI: {})", e, file_path))?;

      // 尝试获取持久化URI权限（如果还没有获取的话）
      // 这可以确保即使权限在文件选择后丢失，也能重新获取
      if let Err(e) = api.take_persistable_uri_permission(&file_uri).await {
        info!(
          "[MOBILE] Warning: Could not take persistable URI permission (may already have it): {:?}",
          e
        );
        // 继续尝试读取，因为权限可能已经存在
      }

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
        .map_err(|e| {
          format!(
            "Failed to read file from URI: {} (URI: {}). This may be due to missing permissions. Please try selecting the file again.",
            e, file_path
          )
        })?;
      let mut contents = Vec::new();
      file
        .read_to_end(&mut contents)
        .map_err(|e| format!("Failed to read file contents: {}", e))?;

      info!(
        "[MOBILE] Successfully read file: {} (size: {} bytes)",
        name,
        contents.len()
      );

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
  let mut connection = TcpConnection::connect(&target_address, target_port)
    .await
    .map_err(|e| format!("Failed to connect: {}", e))?;

  // 发送开始传输消息
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

/// 获取文件大小
#[tauri::command]
pub async fn get_file_size(
  file_path: String,
  #[allow(unused_variables)] app: AppHandle,
) -> Result<u64, String> {
  // 在 Android 上，如果文件路径是 content:// URI，需要特殊处理
  if file_path.starts_with("content://") {
    #[cfg(target_os = "android")]
    {
      use std::io::Read;
      use tauri_plugin_android_fs::{AndroidFsExt, FileUri};

      let api = app.android_fs_async();
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
pub async fn get_file_name(
  file_path: String,
  #[allow(unused_variables)] app: AppHandle,
) -> Result<String, String> {
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

      // 如果无法从 URI 提取，使用后备方法
      #[cfg(target_os = "android")]
      return Ok(get_file_name_from_uri(&file_path));
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
pub async fn save_received_file(
  file_path: String,
  file_name: String,
  app: AppHandle,
) -> Result<String, String> {
  use tauri_plugin_android_fs::AndroidFsExt;
  use tracing::info;

  info!("[MOBILE] Saving file: {} (from: {})", file_name, file_path);

  let api = app.android_fs_async();

  // 读取源文件
  // 接收的文件路径是普通文件系统路径（应用数据目录），不是 content:// URI
  info!("[MOBILE] Reading source file from: {}", file_path);
  let file_data = tokio::fs::read(&file_path)
    .await
    .map_err(|e| format!("Failed to read source file: {} (path: {})", e, file_path))?;

  info!(
    "[MOBILE] File read successfully, size: {} bytes",
    file_data.len()
  );

  // 使用 file_picker().save_file()
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

  // 使用 write 方法写入文件
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

  // 尝试从 URI 中提取更友好的路径信息
  // 在 Android 上，content:// URI 无法直接转换为文件系统路径
  // 但我们可以根据 URI 的 provider 类型显示友好的路径信息
  let display_path = if save_uri_string.starts_with("content://") {
    // 解析 content:// URI，提取有意义的路径信息
    if save_uri_string.contains("com.android.providers.downloads") {
      // 下载文件夹
      "下载文件夹".to_string()
    } else if save_uri_string.contains("com.android.externalstorage") {
      // 外部存储 - 尝试提取实际路径
      if let Some(path_part) = save_uri_string.split("/document/").nth(1) {
        // 格式通常是: primary:path/to/file 或 UUID:path/to/file
        if let Some(colon_pos) = path_part.find(':') {
          let storage_name = &path_part[..colon_pos];
          let file_path = &path_part[colon_pos + 1..];
          if storage_name == "primary" {
            if file_path.is_empty() {
              "内部存储".to_string()
            } else {
              format!("内部存储/{}", file_path)
            }
          } else {
            if file_path.is_empty() {
              format!("存储设备: {}", storage_name)
            } else {
              format!("存储设备: {}/{}", storage_name, file_path)
            }
          }
        } else {
          "存储设备".to_string()
        }
      } else {
        "存储设备".to_string()
      }
    } else if save_uri_string.contains("com.android.providers.media") {
      // 媒体存储
      "媒体文件夹".to_string()
    } else {
      // 其他情况，尝试显示 provider 名称或 URI 的最后部分
      if let Some(provider) = save_uri_string
        .split("content://")
        .nth(1)
        .and_then(|s| s.split('/').next())
      {
        format!(
          "{} 存储",
          provider.replace(".providers.", "/").replace(".", "/")
        )
      } else {
        save_uri_string
          .split('/')
          .last()
          .map(|s| s.to_string())
          .unwrap_or_else(|| save_uri_string.clone())
      }
    }
  } else {
    // 如果不是 content:// URI，直接使用（可能是传统文件路径）
    save_uri_string.clone()
  };

  info!("[MOBILE] File saved successfully to: {}", save_uri_string);
  Ok(format!("文件名: {}\n路径: {}", file_name, display_path))
}

/// 在 Android 上选择文件（使用 Android 文件选择器）
/// 返回包含 URI 和文件名的 JSON 对象
#[tauri::command]
pub async fn select_file_android(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
  use tauri_plugin_android_fs::AndroidFsExt;
  use tracing::info;

  let api = app.android_fs_async();

  info!("[MOBILE] Opening file picker dialog");

  // 使用 file_picker().pick_files()
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
    // 重要：获取持久化URI权限，确保后续可以读取文件
    // 如果不获取持久化权限，URI的访问权限可能会在应用暂停或URI过期后失效
    if let Err(e) = api.take_persistable_uri_permission(file_uri).await {
      info!(
        "[MOBILE] Warning: Failed to take persistable URI permission: {:?}. File may not be accessible later.",
        e
      );
      // 即使获取持久化权限失败，也继续尝试，因为某些URI可能不支持持久化权限
      // 但会在后续读取时可能失败
    } else {
      info!("[MOBILE] Successfully obtained persistable URI permission");
    }

    // 尝试获取文件名
    let file_name = api.get_name(file_uri).await.ok().unwrap_or_else(|| {
      // 如果无法获取文件名，尝试从 URI 中提取
      "未知文件".to_string()
    });

    // FileUri 需要转换为字符串
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
