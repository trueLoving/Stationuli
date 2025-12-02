//! mDNS 设备发现实现

use crate::Result;
use libmdns::Responder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::Ipv4Addr;
use std::sync::{Arc, Mutex};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
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
  device_name: String,
  device_type: String, // "desktop" or "mobile"
  service_registration: Option<libmdns::Service>,
  discovery_handle: Option<JoinHandle<()>>,
  responder: Option<Arc<Mutex<Responder>>>,
  broadcast_handle: Option<JoinHandle<()>>,
  local_ip: Arc<RwLock<Option<String>>>, // 记录实际使用的本地 IP 地址
}

impl MdnsDiscovery {
  pub fn new(port: u16) -> Self {
    let device_id = Self::generate_device_id();
    let device_name = Self::get_device_name();
    Self {
      devices: Arc::new(RwLock::new(HashMap::new())),
      port,
      device_id,
      device_name,
      device_type: "unknown".to_string(),
      service_registration: None,
      discovery_handle: None,
      responder: None,
      broadcast_handle: None,
      local_ip: Arc::new(RwLock::new(None)),
    }
  }

  /// 设置设备类型
  pub fn set_device_type(&mut self, device_type: String) {
    self.device_type = device_type;
  }

  /// 开始服务（简化版：只获取本地IP，不启动自动发现）
  pub async fn start(&mut self) -> Result<()> {
    let device_type_upper = self.device_type.to_uppercase();
    info!(
      "========== [{}] Starting service (port: {}) ==========",
      device_type_upper, self.port
    );
    info!(
      "[{}] Device Type: {}, Port: {}, Device ID: {}, Device Name: {}",
      device_type_upper, self.device_type, self.port, self.device_id, self.device_name
    );

    // 只获取本地 IP 地址，不启动自动发现
    let local_ip = Self::get_local_ip_address().unwrap_or_else(|| "0.0.0.0".to_string());
    info!("[{}] Local IP address: {}", device_type_upper, local_ip);

    // 记录本地 IP
    *self.local_ip.write().await = if local_ip != "0.0.0.0" {
      Some(local_ip)
    } else {
      None
    };

    info!(
      "========== [{}] Service started successfully ==========",
      device_type_upper
    );
    Ok(())
  }

  /// 手动添加设备（用于测试或手动连接）
  pub async fn add_device(&self, device: DeviceInfo) {
    info!("Manually adding device: {:?}", device);
    self.devices.write().await.insert(device.id.clone(), device);
  }

  /// 停止服务（简化版）
  pub async fn stop(&mut self) -> Result<()> {
    info!("Stopping service");

    // 取消服务注册（如果存在）
    if let Some(service) = self.service_registration.take() {
      drop(service);
    }

    // 取消发现任务（如果存在）
    if let Some(handle) = self.discovery_handle.take() {
      handle.abort();
    }

    // 取消广播任务（如果存在）
    if let Some(handle) = self.broadcast_handle.take() {
      handle.abort();
    }

    // 清理设备列表（使用异步写操作）
    self.devices.write().await.clear();

    // 清理响应器（如果存在）
    if let Some(responder) = self.responder.take() {
      drop(responder);
    }

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

  /// 获取本地 IP 地址（实际可连接的地址）
  pub async fn get_local_ip(&self) -> Option<String> {
    self.local_ip.read().await.clone()
  }

  /// 生成设备 ID（基于主机名和时间戳）
  fn generate_device_id() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::time::{SystemTime, UNIX_EPOCH};

    let hostname = hostname::get()
      .ok()
      .and_then(|h| h.to_str().map(|s| s.to_string()))
      .unwrap_or_else(|| "unknown".to_string());

    let timestamp = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_secs();

    let mut hasher = DefaultHasher::new();
    hostname.hash(&mut hasher);
    timestamp.hash(&mut hasher);
    format!("device-{:x}", hasher.finish())
  }

  /// 获取设备名称
  fn get_device_name() -> String {
    hostname::get()
      .ok()
      .and_then(|h| h.to_str().map(|s| s.to_string()))
      .unwrap_or_else(|| "stationuli-device".to_string())
  }

  /// 获取本地 IP 地址
  fn get_local_ip_address() -> Option<String> {
    use std::net::UdpSocket;

    // 通过连接到一个远程地址来获取本地 IP
    // 这不会实际发送数据，只是用来确定本地 IP
    match UdpSocket::bind("0.0.0.0:0") {
      Ok(socket) => {
        // 连接到 Google DNS（不会实际连接，只是用来确定路由）
        if socket.connect("8.8.8.8:80").is_ok() {
          if let Ok(local_addr) = socket.local_addr() {
            let ip = local_addr.ip();
            // 在Android模拟器中，如果获取到的是10.0.2.15，尝试获取Mac的实际IP
            if ip.to_string() == "10.0.2.15" {
              if let Some(mac_ip) = Self::get_mac_ip_from_simulator() {
                return Some(mac_ip.to_string());
              }
            }
            return Some(ip.to_string());
          }
        }
      }
      Err(_) => {}
    }
    None
  }

  /// 在Android模拟器中获取Mac的实际IP地址
  /// 模拟器的网络配置：
  /// - 10.0.2.15: 模拟器内部IP
  /// - 10.0.2.2: Mac的网关IP（在模拟器中可以访问Mac）
  ///
  /// 注意：在Android模拟器中，无法直接获取Mac的实际局域网IP
  /// 这个方法主要用于桌面端，在移动端会返回None
  /// 移动端应该依赖桌面端在广播消息中提供的IP地址
  fn get_mac_ip_from_simulator() -> Option<Ipv4Addr> {
    #[cfg(target_os = "android")]
    {
      // 在Android上（包括模拟器），无法直接获取Mac的实际IP
      // 移动端应该依赖桌面端在广播消息中提供的IP地址
      return None;
    }

    #[cfg(not(target_os = "android"))]
    {
      // 在桌面端（Mac/Windows/Linux），尝试获取所有网络接口
      // 使用标准库的方法枚举网络接口
      use std::net::{IpAddr, UdpSocket};

      // 方法1: 尝试通过连接到外部地址获取实际IP
      // 尝试连接到多个可能的网关地址来获取本地IP
      let test_addresses = vec!["8.8.8.8:80", "1.1.1.1:80"];
      for addr in test_addresses {
        if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
          if socket.connect(addr).is_ok() {
            if let Ok(local_addr) = socket.local_addr() {
              let ip = local_addr.ip();
              if let IpAddr::V4(ipv4) = ip {
                // 跳过模拟器网络和特殊地址
                if !ipv4.octets().starts_with(&[10, 0, 2])
                  && !ipv4.is_loopback()
                  && !ipv4.is_unspecified()
                {
                  return Some(ipv4);
                }
              }
            }
          }
        }
      }

      // 方法2: 如果方法1失败，尝试使用if_addrs crate（如果可用）
      // 注意：这里不直接依赖if_addrs，而是通过条件编译
      // 如果项目中有if_addrs依赖，可以使用它
      // 否则返回None，让调用者使用其他方法
      return None;
    }
  }
}
