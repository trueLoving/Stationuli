// 日志系统 - 将日志发送到前端界面

use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tracing_subscriber::{filter::EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

/// 初始化日志系统，将日志发送到前端界面
pub fn init_logging_to_ui(app: &AppHandle, device_type: &str) -> Result<(), String> {
  let app_handle = Arc::new(app.clone());
  let device_type = device_type.to_string();

  // 创建自定义 writer
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
    EnvFilter::new("warn")
      // 允许 mdns 模块的 info 级别日志
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
  app: Arc<AppHandle>,
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
