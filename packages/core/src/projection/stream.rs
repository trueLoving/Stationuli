//! 投影流传输模块

use crate::Result;
use crate::p2p::tcp::TcpConnection;
use crate::projection::{ProjectionConfig, ProjectionFrame};
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, interval};

/// 投影流
pub struct ProjectionStream {
  connection: Arc<RwLock<Option<TcpConnection>>>,
  config: ProjectionConfig,
  is_streaming: Arc<RwLock<bool>>,
}

impl ProjectionStream {
  /// 创建新的投影流
  pub fn new(config: ProjectionConfig) -> Self {
    Self {
      connection: Arc::new(RwLock::new(None)),
      config,
      is_streaming: Arc::new(RwLock::new(false)),
    }
  }

  /// 连接到目标设备
  pub async fn connect(&mut self, address: &str, port: u16) -> Result<()> {
    let connection = TcpConnection::connect(address, port).await?;
    *self.connection.write().await = Some(connection);
    Ok(())
  }

  /// 开始发送投影流
  pub async fn start_streaming<F>(&self, mut capture: F) -> Result<()>
  where
    F: FnMut()
        -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<ProjectionFrame>> + Send>>
      + Send
      + Sync
      + 'static,
  {
    // 检查是否已经在流式传输
    {
      let mut is_streaming = self.is_streaming.write().await;
      if *is_streaming {
        return Err(crate::Error::Protocol("Already streaming".to_string()));
      }
      *is_streaming = true;
    }

    let connection = self.connection.clone();
    let is_streaming = self.is_streaming.clone();
    let fps = self.config.fps;
    let frame_duration = Duration::from_secs(1) / fps;

    // 启动流式传输任务
    tokio::spawn(async move {
      let mut interval = interval(frame_duration);

      loop {
        // 检查是否应该停止
        {
          let streaming = is_streaming.read().await;
          if !*streaming {
            break;
          }
        }

        interval.tick().await;

        // 捕获帧
        let frame = match capture().await {
          Ok(frame) => frame,
          Err(e) => {
            tracing::warn!("Failed to capture frame: {}", e);
            continue;
          }
        };

        // 发送帧
        // 序列化帧数据
        use base64::{Engine as _, engine::general_purpose};
        let frame_data = match serde_json::to_vec(&serde_json::json!({
          "width": frame.width,
          "height": frame.height,
          "timestamp": frame.timestamp,
          "data": general_purpose::STANDARD.encode(&frame.data),
        })) {
          Ok(data) => data,
          Err(e) => {
            tracing::warn!("Failed to serialize frame: {}", e);
            continue;
          }
        };

        // 使用 write 锁来获取可变引用
        let mut conn_guard = connection.write().await;
        if let Some(ref mut conn) = *conn_guard {
          if let Err(e) = conn.send(&frame_data).await {
            tracing::warn!("Failed to send frame: {}", e);
            // 如果连接失败，停止流式传输
            break;
          }
        } else {
          tracing::warn!("No connection available");
          break;
        }
        drop(conn_guard); // 释放锁
      }

      // 清理
      *is_streaming.write().await = false;
    });

    Ok(())
  }

  /// 停止流式传输
  pub async fn stop_streaming(&self) -> Result<()> {
    *self.is_streaming.write().await = false;
    Ok(())
  }

  /// 接收投影流
  pub async fn receive_stream<F>(&self, mut on_frame: F) -> Result<()>
  where
    F: FnMut(ProjectionFrame) + Send + Sync + 'static,
  {
    let connection = self.connection.clone();
    let is_streaming = self.is_streaming.clone();

    *is_streaming.write().await = true;

    tokio::spawn(async move {
      loop {
        // 检查是否应该停止
        {
          let streaming = is_streaming.read().await;
          if !*streaming {
            break;
          }
        }

        // 接收帧
        // 使用 write 锁来获取可变引用
        let mut conn_guard = connection.write().await;
        if let Some(ref mut conn) = *conn_guard {
          // 接收数据
          let data = match conn.receive().await {
            Ok(data) => data,
            Err(e) => {
              tracing::warn!("Failed to receive data: {}", e);
              break;
            }
          };

          // 解析帧
          let json: serde_json::Value = match serde_json::from_slice(&data) {
            Ok(json) => json,
            Err(e) => {
              tracing::warn!("Failed to parse frame: {}", e);
              continue;
            }
          };

          let width = match json["width"].as_u64() {
            Some(w) => w as u32,
            None => {
              tracing::warn!("Invalid width");
              continue;
            }
          };

          let height = match json["height"].as_u64() {
            Some(h) => h as u32,
            None => {
              tracing::warn!("Invalid height");
              continue;
            }
          };

          let timestamp = match json["timestamp"].as_u64() {
            Some(t) => t,
            None => {
              tracing::warn!("Invalid timestamp");
              continue;
            }
          };

          let data_base64 = match json["data"].as_str() {
            Some(d) => d,
            None => {
              tracing::warn!("Invalid data");
              continue;
            }
          };

          use base64::{Engine as _, engine::general_purpose};
          let frame_data = match general_purpose::STANDARD.decode(data_base64) {
            Ok(d) => d,
            Err(e) => {
              tracing::warn!("Failed to decode base64: {}", e);
              continue;
            }
          };

          let frame = ProjectionFrame {
            data: frame_data,
            width,
            height,
            timestamp,
          };

          on_frame(frame);
        } else {
          tracing::warn!("No connection available");
          break;
        }
        drop(conn_guard); // 释放锁
      }

      *is_streaming.write().await = false;
    });

    Ok(())
  }

  /// 关闭连接
  pub async fn close(&mut self) -> Result<()> {
    *self.is_streaming.write().await = false;
    if let Some(ref mut conn) = *self.connection.write().await {
      conn.close()?;
    }
    *self.connection.write().await = None;
    Ok(())
  }
}
