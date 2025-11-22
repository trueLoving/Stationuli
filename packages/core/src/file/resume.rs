//! 断点续传模块

use crate::Result;

/// 断点续传
pub struct ResumeTransfer {
  // TODO: 实现断点续传
}

impl ResumeTransfer {
  pub fn new() -> Self {
    Self {}
  }

  /// 保存传输进度
  pub fn save_progress(&self, transfer_id: &str, progress: u64) -> Result<()> {
    // TODO: 实现进度保存
    Ok(())
  }

  /// 恢复传输
  pub fn resume(&mut self, transfer_id: &str) -> Result<()> {
    // TODO: 实现传输恢复
    Ok(())
  }
}
