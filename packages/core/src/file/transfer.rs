//! 文件传输模块

use crate::Result;
use crate::file::chunk::FileChunk;
use crate::p2p::tcp::TcpConnection;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;
use tracing::{info, warn};

/// 文件传输消息类型
#[derive(Debug, Serialize, Deserialize)]
pub enum TransferMessage {
  /// 开始传输
  StartTransfer {
    file_name: String,
    file_size: u64,
    total_chunks: u64,
  },
  /// 传输分片
  Chunk { chunk_id: u64, data: Vec<u8> },
  /// 传输完成
  Complete,
  /// 传输错误
  Error(String),
}

/// 文件传输
pub struct FileTransfer {
  chunk_size: usize,
}

impl FileTransfer {
  pub fn new() -> Self {
    Self {
      chunk_size: 1024 * 1024, // 1MB per chunk
    }
  }

  /// 发送文件
  pub async fn send_file(
    &self,
    file_path: &str,
    target_address: &str,
    target_port: u16,
  ) -> Result<()> {
    self
      .send_file_with_progress(file_path, target_address, target_port, None)
      .await
  }

  /// 发送文件（带进度回调）
  pub async fn send_file_with_progress(
    &self,
    file_path: &str,
    target_address: &str,
    target_port: u16,
    progress_callback: Option<Box<dyn Fn(u64, u64) + Send + Sync>>, // (sent_bytes, total_bytes)
  ) -> Result<()> {
    info!(
      "Sending file: {} to {}:{}",
      file_path, target_address, target_port
    );

    // 读取文件
    // 在 Android 上，文件路径可能是 content:// URI，需要特殊处理
    let file_data = if file_path.starts_with("content://") {
      // Android content URI - 需要通过 Tauri 的 Android FS 插件读取
      // 注意：这里需要在调用端处理，因为 core 库不应该依赖 Tauri
      return Err(crate::Error::File(
        "Content URI detected. Please use Tauri's Android FS plugin to read the file first."
          .to_string(),
      ));
    } else {
      // 普通文件路径
      let file_path = Path::new(file_path);
      fs::read(file_path)
        .await
        .map_err(|e| crate::Error::File(format!("Read file failed: {}", e)))?
    };

    // 获取文件名
    let file_name = if file_path.starts_with("content://") {
      // 对于 content URI，尝试从路径中提取文件名，或使用默认名称
      file_path.split('/').last().unwrap_or("file").to_string()
    } else {
      Path::new(file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| crate::Error::File("Invalid file path".to_string()))?
        .to_string()
    };

    let file_size = file_data.len() as u64;

    // 建立连接
    let mut connection = TcpConnection::connect(target_address, target_port).await?;

    // 分片文件
    let chunks = FileChunk::split_file(&file_data, self.chunk_size, file_name.clone());

    // 发送开始传输消息
    let start_msg = TransferMessage::StartTransfer {
      file_name: file_name.clone(),
      file_size,
      total_chunks: chunks.len() as u64,
    };
    let start_data = serde_json::to_vec(&start_msg)
      .map_err(|e| crate::Error::Protocol(format!("Serialize failed: {}", e)))?;
    connection.send(&start_data).await?;

    info!(
      "Sending file: {} ({} bytes, {} chunks)",
      file_name,
      file_size,
      chunks.len()
    );

    // 发送所有分片
    let mut sent_bytes = 0u64;
    for (i, chunk) in chunks.iter().enumerate() {
      let chunk_msg = TransferMessage::Chunk {
        chunk_id: chunk.chunk_id,
        data: chunk.data.clone(),
      };
      let chunk_data = serde_json::to_vec(&chunk_msg)
        .map_err(|e| crate::Error::Protocol(format!("Serialize failed: {}", e)))?;
      connection.send(&chunk_data).await?;

      sent_bytes += chunk.data.len() as u64;

      // 调用进度回调
      if let Some(ref callback) = progress_callback {
        callback(sent_bytes, file_size);
      }

      if (i + 1) % 10 == 0 {
        info!(
          "Sent {}/{} chunks ({}%)",
          i + 1,
          chunks.len(),
          (sent_bytes * 100 / file_size)
        );
      }
    }

    // 发送完成消息
    let complete_msg = TransferMessage::Complete;
    let complete_data = serde_json::to_vec(&complete_msg)
      .map_err(|e| crate::Error::Protocol(format!("Serialize failed: {}", e)))?;
    connection.send(&complete_data).await?;

    connection.close()?;
    info!("File transfer completed: {}", file_name);

    Ok(())
  }

  /// 接收文件
  /// 返回接收到的文件路径
  pub async fn receive_file(
    &self,
    save_path: &str,
    listener: &tokio::net::TcpListener,
  ) -> Result<String> {
    info!("Waiting for file transfer on listener...");

    // 接受连接
    let mut connection = TcpConnection::accept(listener).await?;

    // 接收开始传输消息
    let start_data = connection.receive().await?;
    let start_msg: TransferMessage = serde_json::from_slice(&start_data)
      .map_err(|e| crate::Error::Protocol(format!("Deserialize failed: {}", e)))?;

    let (file_name, file_size, total_chunks) = match start_msg {
      TransferMessage::StartTransfer {
        file_name,
        file_size,
        total_chunks,
      } => (file_name, file_size, total_chunks),
      _ => {
        return Err(crate::Error::Protocol(
          "Expected StartTransfer message".to_string(),
        ));
      }
    };

    info!(
      "Receiving file: {} ({} bytes, {} chunks)",
      file_name, file_size, total_chunks
    );

    // 接收所有分片
    let mut chunks = Vec::new();
    let mut received_chunks = 0;

    loop {
      let chunk_data = connection.receive().await?;
      let chunk_msg: TransferMessage = serde_json::from_slice(&chunk_data)
        .map_err(|e| crate::Error::Protocol(format!("Deserialize failed: {}", e)))?;

      match chunk_msg {
        TransferMessage::Chunk { chunk_id, data } => {
          chunks.push(FileChunk {
            chunk_id,
            data,
            total_chunks,
            file_name: file_name.clone(),
            file_size,
          });
          received_chunks += 1;

          if received_chunks % 10 == 0 {
            info!("Received {}/{} chunks", received_chunks, total_chunks);
          }

          if received_chunks >= total_chunks {
            break;
          }
        }
        TransferMessage::Complete => {
          break;
        }
        TransferMessage::Error(err) => {
          return Err(crate::Error::File(format!("Transfer error: {}", err)));
        }
        _ => {
          warn!("Unexpected message type");
        }
      }
    }

    // 合并分片
    let file_data = FileChunk::merge_chunks(chunks)?;

    // 保存文件
    // save_path 可以是目录路径或完整文件路径
    let save_path = Path::new(save_path);
    let final_path = if save_path.is_dir() || save_path.ends_with("/") || save_path.ends_with("\\")
    {
      // 如果是目录路径，使用接收到的文件名
      save_path.join(&file_name)
    } else {
      // 如果是完整文件路径，直接使用
      save_path.to_path_buf()
    };

    // 确保父目录存在
    if let Some(parent) = final_path.parent() {
      fs::create_dir_all(parent)
        .await
        .map_err(|e| crate::Error::File(format!("Create directory failed: {}", e)))?;
    }

    fs::write(&final_path, &file_data)
      .await
      .map_err(|e| crate::Error::File(format!("Write file failed: {}", e)))?;

    connection.close()?;
    info!("File received and saved: {}", final_path.display());

    // 返回接收到的文件路径
    Ok(final_path.to_string_lossy().to_string())
  }
}
