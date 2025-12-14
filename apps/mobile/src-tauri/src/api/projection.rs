// 投影相关 API 命令（移动端）

use crate::state::AppState;
use base64::{Engine as _, engine::general_purpose};
use stationuli_core::projection::{ProjectionConfig, ProjectionStream, ScreenCapture};
use tauri::{AppHandle, Emitter, State};

/// 开始投影（发送屏幕到目标设备）
#[tauri::command]
pub async fn start_projection(
  target_address: String,
  target_port: u16,
  fps: Option<u32>,
  quality: Option<u8>,
  state: State<'_, AppState>,
  app: AppHandle,
) -> Result<String, String> {
  use tracing::info;

  info!("[MOBILE] 开始投影到 {}:{}", target_address, target_port);

  // Android 平台暂不支持屏幕捕获
  #[cfg(target_os = "android")]
  {
    return Err("Android 平台暂不支持屏幕投影功能".to_string());
  }

  // 创建投影配置
  let config = ProjectionConfig {
    fps: fps.unwrap_or(10),
    quality: quality.unwrap_or(75),
    max_width: Some(1920),
    max_height: Some(1080),
  };

  // 创建投影流（需要移动 config）
  let mut stream = ProjectionStream::new(config.clone());

  // 连接到目标设备
  stream
    .connect(&target_address, target_port)
    .await
    .map_err(|e| format!("连接失败: {}", e))?;

  // 保存投影流到状态
  {
    let mut projection_guard = state.inner().projection_stream.write().await;
    *projection_guard = Some(stream);
  }

  // 启动流式传输
  let projection_stream = state.inner().projection_stream.clone();
  let app_clone = app.clone();

  // 在闭包外克隆 config，以便在闭包内使用
  let capture_config = config.clone();

  tokio::spawn(async move {
    let stream_guard = projection_stream.read().await;
    if let Some(ref stream) = *stream_guard {
      // 创建捕获闭包
      let _ = stream
        .start_streaming(move || {
          let config = capture_config.clone();
          Box::pin(async move {
            let capture = ScreenCapture::new(config);
            capture.capture_frame().await
          })
        })
        .await;

      // 发送事件通知前端
      app_clone.emit("projection-started", ()).unwrap_or_default();
    }
  });

  Ok("投影已启动".to_string())
}

/// 停止投影
#[tauri::command]
pub async fn stop_projection(state: State<'_, AppState>) -> Result<String, String> {
  use tracing::info;

  info!("[MOBILE] 停止投影");

  let mut projection_guard = state.inner().projection_stream.write().await;
  if let Some(ref mut stream) = *projection_guard {
    stream
      .stop_streaming()
      .await
      .map_err(|e| format!("停止投影失败: {}", e))?;
    stream
      .close()
      .await
      .map_err(|e| format!("关闭连接失败: {}", e))?;
  }

  *projection_guard = None;

  Ok("投影已停止".to_string())
}

/// 开始接收投影（从目标设备接收屏幕）
#[tauri::command]
pub async fn start_receiving_projection(
  target_address: String,
  target_port: u16,
  state: State<'_, AppState>,
  app: AppHandle,
) -> Result<String, String> {
  use tracing::info;

  info!("[MOBILE] 开始接收投影从 {}:{}", target_address, target_port);

  // 创建投影配置
  let config = ProjectionConfig::default();

  // 创建投影流
  let mut stream = ProjectionStream::new(config);

  // 连接到目标设备
  stream
    .connect(&target_address, target_port)
    .await
    .map_err(|e| format!("连接失败: {}", e))?;

  // 保存投影流到状态
  {
    let mut projection_guard = state.inner().projection_stream.write().await;
    *projection_guard = Some(stream);
  }

  // 启动接收流
  let projection_stream = state.inner().projection_stream.clone();
  let app_clone = app.clone();

  tokio::spawn(async move {
    let stream_guard = projection_stream.read().await;
    if let Some(ref stream) = *stream_guard {
      // 在闭包内克隆 app_clone，以便在 receive_stream 的闭包中使用
      let app_for_frames = app_clone.clone();

      // 先发送开始事件
      app_clone
        .emit("projection-receiving-started", ())
        .unwrap_or_default();

      let _ = stream
        .receive_stream(move |frame| {
          // 发送帧数据到前端
          app_for_frames
            .emit(
              "projection-frame",
              serde_json::json!({
                "width": frame.width,
                "height": frame.height,
                "timestamp": frame.timestamp,
                "data": general_purpose::STANDARD.encode(&frame.data)
              }),
            )
            .unwrap_or_default();
        })
        .await;
    }
  });

  Ok("开始接收投影".to_string())
}

/// 停止接收投影
#[tauri::command]
pub async fn stop_receiving_projection(state: State<'_, AppState>) -> Result<String, String> {
  use tracing::info;

  info!("[MOBILE] 停止接收投影");

  let mut projection_guard = state.inner().projection_stream.write().await;
  if let Some(ref mut stream) = *projection_guard {
    stream
      .stop_streaming()
      .await
      .map_err(|e| format!("停止接收失败: {}", e))?;
    stream
      .close()
      .await
      .map_err(|e| format!("关闭连接失败: {}", e))?;
  }

  *projection_guard = None;

  Ok("已停止接收投影".to_string())
}
