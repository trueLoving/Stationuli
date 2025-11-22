//! 文件传输模块

use crate::Result;

/// 文件传输
pub struct FileTransfer {
  // TODO: 实现文件传输
}

impl FileTransfer {
  pub fn new() -> Self {
    Self {}
  }

  /// 发送文件
  pub async fn send_file(&mut self, path: &str, target: &str) -> Result<()> {
    // TODO: 实现文件发送
    Ok(())
  }

  /// 接收文件
  pub async fn receive_file(&mut self, path: &str) -> Result<()> {
    // TODO: 实现文件接收
    Ok(())
  }
}
