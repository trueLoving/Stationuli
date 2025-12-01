//! Stationuli Core Library
//!
//! 提供 P2P 文件传输、设备发现、加密等核心功能

pub mod crypto;
pub mod file;
pub mod p2p;

/// 核心错误类型
#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("Network error: {0}")]
  Network(String),

  #[error("Crypto error: {0}")]
  Crypto(String),

  #[error("File error: {0}")]
  File(String),

  #[error("Protocol error: {0}")]
  Protocol(String),
}

/// 核心结果类型
pub type Result<T> = std::result::Result<T, Error>;

/// 初始化核心库
///
/// # Arguments
/// * `device_type` - 设备类型（"desktop" 或 "mobile"），用于在日志中标识
///
/// 注意：日志系统应该在应用层（桌面端/移动端）初始化，这里只记录启动信息
pub fn init(device_type: &str) -> Result<()> {
  // 记录启动信息
  // 注意：日志系统应该在应用层已经初始化，这里直接使用 tracing::info!
  tracing::info!(
    "========== {}: Core library initialized ==========",
    device_type.to_uppercase()
  );
  tracing::info!("Device Type: {}", device_type);

  Ok(())
}
