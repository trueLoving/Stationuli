//! P2P 协议栈模块
//!
//! 提供 QUIC、TCP、mDNS 等网络协议实现

pub mod mdns;
pub mod quic;
pub mod tcp;

pub use mdns::MdnsDiscovery;
pub use quic::QuicConnection;
pub use tcp::TcpConnection;

/// P2P 连接 trait
pub trait Connection {
  fn connect(&mut self) -> crate::Result<()>;
  fn send(&mut self, data: &[u8]) -> crate::Result<()>;
  fn receive(&mut self) -> crate::Result<Vec<u8>>;
  fn close(&mut self) -> crate::Result<()>;
}
