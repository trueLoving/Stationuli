//! QUIC 协议实现

use crate::Result;

/// QUIC 连接
pub struct QuicConnection {
  // TODO: 实现 QUIC 连接
}

impl QuicConnection {
  pub fn new() -> Self {
    Self {}
  }
}

impl crate::p2p::Connection for QuicConnection {
  fn connect(&mut self) -> Result<()> {
    // TODO: 实现 QUIC 连接
    Ok(())
  }

  fn send(&mut self, _data: &[u8]) -> Result<()> {
    // TODO: 实现 QUIC 发送
    Ok(())
  }

  fn receive(&mut self) -> Result<Vec<u8>> {
    // TODO: 实现 QUIC 接收
    Ok(vec![])
  }

  fn close(&mut self) -> Result<()> {
    // TODO: 实现 QUIC 关闭
    Ok(())
  }
}
