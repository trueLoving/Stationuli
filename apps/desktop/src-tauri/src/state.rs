// 应用状态管理

use stationuli_core::file::transfer::FileTransfer;
use stationuli_core::p2p::mdns::MdnsDiscovery;
use stationuli_core::projection::stream::ProjectionStream;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 全局应用状态
pub struct AppState {
  pub discovery: Arc<RwLock<Option<MdnsDiscovery>>>,
  pub file_transfer: Arc<RwLock<FileTransfer>>,
  pub tcp_listener: Arc<RwLock<Option<tokio::net::TcpListener>>>,
  pub projection_stream: Arc<RwLock<Option<ProjectionStream>>>,
}

impl AppState {
  /// 创建新的应用状态
  pub fn new() -> Self {
    Self {
      discovery: Arc::new(RwLock::new(None)),
      file_transfer: Arc::new(RwLock::new(FileTransfer::new())),
      tcp_listener: Arc::new(RwLock::new(None)),
      projection_stream: Arc::new(RwLock::new(None)),
    }
  }
}

impl Default for AppState {
  fn default() -> Self {
    Self::new()
  }
}
