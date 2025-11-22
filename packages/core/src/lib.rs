//! Stationuli Core Library
//!
//! 提供 P2P 文件传输、设备发现、加密等核心功能

pub mod crypto;
pub mod ffi;
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
pub fn init() -> Result<()> {
  tracing_subscriber::fmt::init();
  Ok(())
}
