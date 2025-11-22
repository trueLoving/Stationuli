//! TCP 协议实现

use crate::Result;

/// TCP 连接
pub struct TcpConnection {
  // TODO: 实现 TCP 连接
}

impl TcpConnection {
  pub fn new() -> Self {
    Self {}
  }
}

impl crate::p2p::Connection for TcpConnection {
  fn connect(&mut self) -> Result<()> {
    // TODO: 实现 TCP 连接
    Ok(())
  }

  fn send(&mut self, _data: &[u8]) -> Result<()> {
    // TODO: 实现 TCP 发送
    Ok(())
  }

  fn receive(&mut self) -> Result<Vec<u8>> {
    // TODO: 实现 TCP 接收
    Ok(vec![])
  }

  fn close(&mut self) -> Result<()> {
    // TODO: 实现 TCP 关闭
    Ok(())
  }
}
