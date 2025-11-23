//! mDNS 设备发现实现
//!
//! 简化版本：先实现基本的设备发现，后续可以优化为完整的 mDNS

use crate::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

/// 设备信息
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DeviceInfo {
  pub id: String,
  pub name: String,
  pub address: String,
  pub port: u16,
  pub device_type: String, // "desktop" or "mobile"
}

/// mDNS 设备发现
pub struct MdnsDiscovery {
  devices: Arc<RwLock<HashMap<String, DeviceInfo>>>,
  port: u16,
  device_id: String,
}

impl MdnsDiscovery {
  pub fn new(port: u16) -> Self {
    Self {
      devices: Arc::new(RwLock::new(HashMap::new())),
      port,
      device_id: Self::generate_device_id(),
    }
  }

  /// 开始设备发现
  pub async fn start(&mut self) -> Result<()> {
    info!("Starting device discovery on port {}", self.port);

    // 启动 mDNS 服务广播（简化版本）
    self.start_service().await?;

    // 启动设备发现（简化版本：定期扫描）
    self.start_discovery().await?;

    Ok(())
  }

  /// 启动 mDNS 服务广播
  async fn start_service(&self) -> Result<()> {
    // 简化实现：暂时跳过 mDNS，使用手动连接
    // TODO: 实现完整的 mDNS 服务注册
    info!(
      "mDNS service will be registered on port {} (simplified)",
      self.port
    );
    Ok(())
  }

  /// 启动设备发现
  async fn start_discovery(&self) -> Result<()> {
    // 简化实现：暂时跳过自动发现
    // TODO: 实现完整的 mDNS 浏览器
    info!("Device discovery started (simplified - manual add required)");
    Ok(())
  }

  /// 手动添加设备（用于测试或手动连接）
  pub async fn add_device(&self, device: DeviceInfo) {
    info!("Manually adding device: {:?}", device);
    self.devices.write().await.insert(device.id.clone(), device);
  }

  /// 停止设备发现
  pub fn stop(&mut self) -> Result<()> {
    info!("Stopping device discovery");
    self.devices.blocking_write().clear();
    Ok(())
  }

  /// 获取发现的设备列表
  pub async fn get_devices(&self) -> Vec<DeviceInfo> {
    self.devices.read().await.values().cloned().collect()
  }

  /// 获取设备 ID
  pub fn device_id(&self) -> &str {
    &self.device_id
  }

  /// 生成设备 ID（基于主机名和时间戳）
  fn generate_device_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    // 简化实现：使用时间戳和随机数
    // 实际应该使用 MAC 地址或设备唯一标识
    let timestamp = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_secs();
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    format!("device-{:x}", hasher.finish())
  }
}
