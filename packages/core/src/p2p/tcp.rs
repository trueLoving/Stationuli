//! TCP 协议实现

use crate::Result;
use std::net::SocketAddr;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tracing::info;

/// TCP 连接
pub struct TcpConnection {
  stream: Option<TcpStream>,
  address: SocketAddr,
}

impl TcpConnection {
  /// 创建新的 TCP 连接（客户端）
  pub async fn connect(address: &str, port: u16) -> Result<Self> {
    let addr = format!("{}:{}", address, port)
      .parse::<SocketAddr>()
      .map_err(|e| crate::Error::Network(format!("Invalid address: {}", e)))?;

    info!("Connecting to {}", addr);
    let stream = TcpStream::connect(addr)
      .await
      .map_err(|e| crate::Error::Network(format!("Connection failed: {}", e)))?;

    info!("Connected to {}", addr);

    Ok(Self {
      stream: Some(stream),
      address: addr,
    })
  }

  /// 创建 TCP 服务器
  pub async fn listen(port: u16) -> Result<TcpListener> {
    let addr = format!("0.0.0.0:{}", port)
      .parse::<SocketAddr>()
      .map_err(|e| crate::Error::Network(format!("Invalid address: {}", e)))?;

    let listener = TcpListener::bind(addr)
      .await
      .map_err(|e| crate::Error::Network(format!("Bind failed: {}", e)))?;

    info!("TCP server listening on {}", addr);
    Ok(listener)
  }

  /// 从服务器接受连接
  pub async fn accept(listener: &TcpListener) -> Result<Self> {
    let (stream, addr) = listener
      .accept()
      .await
      .map_err(|e| crate::Error::Network(format!("Accept failed: {}", e)))?;

    info!("Accepted connection from {}", addr);

    Ok(Self {
      stream: Some(stream),
      address: addr,
    })
  }

  /// 发送数据
  pub async fn send(&mut self, data: &[u8]) -> Result<()> {
    if let Some(ref mut stream) = self.stream {
      // 先发送数据长度（4 字节）
      let len = data.len() as u32;
      stream
        .write_u32(len)
        .await
        .map_err(|e| crate::Error::Network(format!("Write length failed: {}", e)))?;

      // 发送数据
      stream
        .write_all(data)
        .await
        .map_err(|e| crate::Error::Network(format!("Write data failed: {}", e)))?;

      stream
        .flush()
        .await
        .map_err(|e| crate::Error::Network(format!("Flush failed: {}", e)))?;

      Ok(())
    } else {
      Err(crate::Error::Network(
        "Connection not established".to_string(),
      ))
    }
  }

  /// 接收数据
  pub async fn receive(&mut self) -> Result<Vec<u8>> {
    if let Some(ref mut stream) = self.stream {
      // 先读取数据长度
      let len = stream
        .read_u32()
        .await
        .map_err(|e| crate::Error::Network(format!("Read length failed: {}", e)))?;

      // 读取数据
      let mut data = vec![0u8; len as usize];
      stream
        .read_exact(&mut data)
        .await
        .map_err(|e| crate::Error::Network(format!("Read data failed: {}", e)))?;

      Ok(data)
    } else {
      Err(crate::Error::Network(
        "Connection not established".to_string(),
      ))
    }
  }

  /// 关闭连接
  pub fn close(&mut self) -> Result<()> {
    if let Some(stream) = self.stream.take() {
      drop(stream);
      info!("Connection to {} closed", self.address);
    }
    Ok(())
  }

  /// 获取远程地址
  pub fn address(&self) -> &SocketAddr {
    &self.address
  }
}

impl crate::p2p::Connection for TcpConnection {
  fn connect(&mut self) -> Result<()> {
    // 异步方法，需要在 async 上下文中调用
    Err(crate::Error::Network(
      "Use TcpConnection::connect() instead".to_string(),
    ))
  }

  fn send(&mut self, _data: &[u8]) -> Result<()> {
    // 异步方法，需要在 async 上下文中调用
    Err(crate::Error::Network(
      "Use TcpConnection::send() instead".to_string(),
    ))
  }

  fn receive(&mut self) -> Result<Vec<u8>> {
    // 异步方法，需要在 async 上下文中调用
    Err(crate::Error::Network(
      "Use TcpConnection::receive() instead".to_string(),
    ))
  }

  fn close(&mut self) -> Result<()> {
    self.close()
  }
}
