//! mDNS 设备发现实现

use crate::Result;
use libmdns::Responder;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::{Arc, Mutex};
use tokio::net::UdpSocket as TokioUdpSocket;
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio::time::{Duration, interval};
use tracing::{info, warn};

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
    }
  }

  /// 设置设备类型
  pub fn set_device_type(&mut self, device_type: String) {
    self.device_type = device_type;
  }

  /// 开始设备发现
  pub async fn start(&mut self) -> Result<()> {
    info!(
      "Starting device discovery on port {} (device: {})",
      self.port, self.device_name
    );

    // 启动 mDNS 服务广播
    self.start_service().await?;

    // 启动设备发现
    self.start_discovery().await?;

    Ok(())
  }

  /// 启动 mDNS 服务广播
  async fn start_service(&mut self) -> Result<()> {
    // 创建 mDNS 响应器（同步调用）
    let responder = Responder::new()
      .map_err(|e| crate::Error::Network(format!("Failed to create mDNS responder: {}", e)))?;

    // 构建服务名称和 TXT 记录
    let service_type = "_stationuli._tcp.local.";
    let instance_name = format!("{}-{}", self.device_name, &self.device_id[..8]);
    let txt_id = format!("id={}", self.device_id);
    let txt_type = format!("type={}", self.device_type);
    let txt_port = format!("port={}", self.port);
    let txt_records = vec![txt_id.as_str(), txt_type.as_str(), txt_port.as_str()];

    info!(
      "Registering mDNS service: {} on port {}",
      instance_name, self.port
    );

    // 注册服务（同步调用）
    let service = responder.register(
      service_type.to_string(),
      instance_name.clone(),
      self.port,
      &txt_records,
    );

    self.service_registration = Some(service);
    self.responder = Some(Arc::new(Mutex::new(responder)));

    info!("mDNS service registered successfully: {}", instance_name);
    Ok(())
  }

  /// 启动设备发现（使用 UDP 多播）
  async fn start_discovery(&mut self) -> Result<()> {
    let devices = self.devices.clone();
    let device_id = self.device_id.clone();

    info!("Starting UDP multicast service discovery...");

    // 创建 UDP socket 用于接收多播消息
    let socket = TokioUdpSocket::bind("0.0.0.0:5354")
      .await
      .map_err(|e| crate::Error::Network(format!("Failed to bind UDP socket: {}", e)))?;

    // 加入多播组
    let multicast_addr: Ipv4Addr = "224.0.0.251".parse().unwrap();
    socket
      .join_multicast_v4(multicast_addr, Ipv4Addr::UNSPECIFIED)
      .map_err(|e| crate::Error::Network(format!("Failed to join multicast group: {}", e)))?;

    // 启动广播任务（定期发送自己的服务信息）
    let broadcast_socket = TokioUdpSocket::bind("0.0.0.0:0")
      .await
      .map_err(|e| crate::Error::Network(format!("Failed to bind broadcast socket: {}", e)))?;
    let device_id_broadcast = self.device_id.clone();
    let device_name_broadcast = self.device_name.clone();
    let device_type_broadcast = self.device_type.clone();
    let port_broadcast = self.port;

    let broadcast_handle = tokio::spawn(async move {
      let mut interval = interval(Duration::from_secs(2));
      loop {
        interval.tick().await;
        let message = format!(
          "STATIONULI:{}:{}:{}:{}:{}",
          device_id_broadcast,
          device_name_broadcast,
          device_type_broadcast,
          port_broadcast,
          "announce"
        );
        let _ = broadcast_socket
          .send_to(
            message.as_bytes(),
            SocketAddr::new(IpAddr::V4(multicast_addr), 5354),
          )
          .await;
      }
    });

    // 启动发现任务（接收多播消息）
    let handle = tokio::spawn(async move {
      let mut buf = [0u8; 1024];
      loop {
        match socket.recv_from(&mut buf).await {
          Ok((len, addr)) => {
            if let Ok(message) = std::str::from_utf8(&buf[..len]) {
              if message.starts_with("STATIONULI:") {
                let parts: Vec<&str> = message.split(':').collect();
                if parts.len() >= 6 && parts[5] == "announce" {
                  let found_id = parts[1].to_string();
                  let found_name = parts[2].to_string();
                  let found_type = parts[3].to_string();
                  let found_port: u16 = parts[4].parse().unwrap_or(8080);

                  // 跳过自己
                  if found_id == device_id {
                    continue;
                  }

                  let device_info = DeviceInfo {
                    id: found_id.clone(),
                    name: found_name.clone(),
                    address: addr.ip().to_string(),
                    port: found_port,
                    device_type: found_type.clone(),
                  };

                  info!(
                    "Discovered device: {} ({}) at {}:{}",
                    device_info.name,
                    device_info.device_type,
                    device_info.address,
                    device_info.port
                  );

                  devices.write().await.insert(found_id.clone(), device_info);
                }
              }
            }
          }
          Err(e) => {
            warn!("Error receiving multicast message: {}", e);
          }
        }
      }
    });

    self.discovery_handle = Some(handle);
    self.broadcast_handle = Some(broadcast_handle);
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

    // 取消服务注册
    if let Some(service) = self.service_registration.take() {
      drop(service); // 释放服务注册会自动取消注册
    }

    // 取消发现任务
    if let Some(handle) = self.discovery_handle.take() {
      handle.abort();
    }

    // 取消广播任务
    if let Some(handle) = self.broadcast_handle.take() {
      handle.abort();
    }

    // 清理设备列表
    self.devices.blocking_write().clear();

    // 清理响应器
    if let Some(responder) = self.responder.take() {
      drop(responder); // 释放 Mutex 和 Responder
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
}
