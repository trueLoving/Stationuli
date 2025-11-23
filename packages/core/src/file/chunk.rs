//! 文件分片模块

use crate::Result;
use serde::{Deserialize, Serialize};

/// 文件分片
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChunk {
  pub chunk_id: u64,
  pub data: Vec<u8>,
  pub total_chunks: u64,
  pub file_name: String,
  pub file_size: u64,
}

impl FileChunk {
  /// 将文件分片
  pub fn split_file(data: &[u8], chunk_size: usize, file_name: String) -> Vec<Self> {
    let file_size = data.len() as u64;
    let total_chunks = (data.len() + chunk_size - 1) / chunk_size;
    let mut chunks = Vec::with_capacity(total_chunks);

    for (i, chunk_data) in data.chunks(chunk_size).enumerate() {
      chunks.push(Self {
        chunk_id: i as u64,
        data: chunk_data.to_vec(),
        total_chunks: total_chunks as u64,
        file_name: file_name.clone(),
        file_size,
      });
    }

    chunks
  }

  /// 合并分片
  pub fn merge_chunks(mut chunks: Vec<Self>) -> Result<Vec<u8>> {
    if chunks.is_empty() {
      return Ok(vec![]);
    }

    // 按 chunk_id 排序
    chunks.sort_by_key(|c| c.chunk_id);

    // 验证完整性
    let total_chunks = chunks[0].total_chunks;
    let file_name = chunks[0].file_name.clone();
    let file_size = chunks[0].file_size;

    if chunks.len() != total_chunks as usize {
      return Err(crate::Error::File(format!(
        "Missing chunks: expected {}, got {}",
        total_chunks,
        chunks.len()
      )));
    }

    // 验证 chunk_id 连续性
    for (i, chunk) in chunks.iter().enumerate() {
      if chunk.chunk_id != i as u64 {
        return Err(crate::Error::File(format!(
          "Missing chunk: expected {}, got {}",
          i, chunk.chunk_id
        )));
      }
    }

    // 合并数据
    let mut result = Vec::with_capacity(file_size as usize);
    for chunk in chunks {
      result.extend_from_slice(&chunk.data);
    }

    // 验证文件大小
    if result.len() != file_size as usize {
      return Err(crate::Error::File(format!(
        "File size mismatch: expected {}, got {}",
        file_size,
        result.len()
      )));
    }

    Ok(result)
  }
}
