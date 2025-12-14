//! 设备投影模块
//!
//! 提供屏幕捕获、编码、传输等功能

pub mod capture;
pub mod stream;

pub use capture::ScreenCapture;
pub use stream::ProjectionStream;

/// 投影帧数据
#[derive(Debug, Clone)]
pub struct ProjectionFrame {
  pub data: Vec<u8>,
  pub width: u32,
  pub height: u32,
  pub timestamp: u64,
}

/// 投影配置
#[derive(Debug, Clone)]
pub struct ProjectionConfig {
  pub fps: u32,
  pub quality: u8, // JPEG 质量 0-100
  pub max_width: Option<u32>,
  pub max_height: Option<u32>,
}

impl Default for ProjectionConfig {
  fn default() -> Self {
    Self {
      fps: 10,
      quality: 75,
      max_width: Some(1920),
      max_height: Some(1080),
    }
  }
}
