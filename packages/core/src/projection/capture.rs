//! 屏幕捕获模块

use crate::Result;
use crate::projection::{ProjectionConfig, ProjectionFrame};
use std::time::{SystemTime, UNIX_EPOCH};

/// 屏幕捕获器
pub struct ScreenCapture {
  config: ProjectionConfig,
}

impl ScreenCapture {
  /// 创建新的屏幕捕获器
  pub fn new(config: ProjectionConfig) -> Self {
    Self { config }
  }

  /// 捕获当前屏幕帧
  pub async fn capture_frame(&self) -> Result<ProjectionFrame> {
    // 获取时间戳
    let timestamp = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_millis() as u64;

    // 使用 screenshots crate 捕获屏幕
    #[cfg(not(target_os = "android"))]
    {
      use screenshots::Screen;

      let screens = Screen::all()
        .map_err(|e| crate::Error::Protocol(format!("Failed to get screens: {}", e)))?;

      if screens.is_empty() {
        return Err(crate::Error::NotFound("No screens found".to_string()));
      }

      // 捕获第一个屏幕
      let screen = &screens[0];
      let image = screen
        .capture()
        .map_err(|e| crate::Error::Protocol(format!("Failed to capture screen: {}", e)))?;

      // screenshots crate 0.6 的 Image 提供 to_png() 方法获取 PNG 格式的字节数据
      // 或者我们可以直接使用 image crate 来处理
      // 先获取 PNG 数据，然后解码为 RGBA
      let png_data = image
        .to_png()
        .map_err(|e| crate::Error::Protocol(format!("Failed to convert image to PNG: {}", e)))?;

      // 使用 image crate 解码 PNG 数据
      let decoded_image = image::load_from_memory(&png_data)
        .map_err(|e| crate::Error::Protocol(format!("Failed to decode PNG: {}", e)))?;

      let width = decoded_image.width();
      let height = decoded_image.height();

      // 调整大小（如果需要）
      let (final_width, final_height) = self.resize_dimensions(width, height);

      // 转换为 RGBA 格式
      let rgba_image = decoded_image.to_rgba8();
      let rgba_data = rgba_image.as_raw();

      // 如果尺寸需要调整，进行缩放
      let resized_data = if final_width != width || final_height != height {
        self.resize_image(rgba_data, width, height, final_width, final_height)
      } else {
        rgba_data.to_vec()
      };

      // 压缩为 JPEG
      let jpeg_data = self.compress_to_jpeg(&resized_data, final_width, final_height)?;

      Ok(ProjectionFrame {
        data: jpeg_data,
        width: final_width,
        height: final_height,
        timestamp,
      })
    }

    #[cfg(target_os = "android")]
    {
      // Android 平台需要特殊处理
      // 这里返回一个占位实现
      Err(crate::Error::Protocol(
        "Screen capture not implemented for Android yet".to_string(),
      ))
    }
  }

  /// 计算调整后的尺寸
  fn resize_dimensions(&self, width: u32, height: u32) -> (u32, u32) {
    let max_width = self.config.max_width.unwrap_or(width);
    let max_height = self.config.max_height.unwrap_or(height);

    if width <= max_width && height <= max_height {
      return (width, height);
    }

    let width_ratio = max_width as f64 / width as f64;
    let height_ratio = max_height as f64 / height as f64;
    let ratio = width_ratio.min(height_ratio);

    (
      (width as f64 * ratio) as u32,
      (height as f64 * ratio) as u32,
    )
  }

  /// 调整图像大小
  fn resize_image(
    &self,
    data: &[u8],
    src_width: u32,
    src_height: u32,
    dst_width: u32,
    dst_height: u32,
  ) -> Vec<u8> {
    // 简单的最近邻缩放实现
    // 对于更好的质量，可以使用 image crate 或其他库
    let mut resized = vec![0u8; (dst_width * dst_height * 4) as usize];

    for y in 0..dst_height {
      for x in 0..dst_width {
        let src_x = (x * src_width / dst_width).min(src_width - 1);
        let src_y = (y * src_height / dst_height).min(src_height - 1);

        let src_idx = ((src_y * src_width + src_x) * 4) as usize;
        let dst_idx = ((y * dst_width + x) * 4) as usize;

        if src_idx + 3 < data.len() && dst_idx + 3 < resized.len() {
          resized[dst_idx] = data[src_idx];
          resized[dst_idx + 1] = data[src_idx + 1];
          resized[dst_idx + 2] = data[src_idx + 2];
          resized[dst_idx + 3] = data[src_idx + 3];
        }
      }
    }

    resized
  }

  /// 压缩为 JPEG
  fn compress_to_jpeg(&self, rgba_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>> {
    // 使用 image crate 进行 JPEG 编码
    use image::{ImageBuffer, RgbaImage};

    let img: RgbaImage = ImageBuffer::from_raw(width, height, rgba_data.to_vec())
      .ok_or_else(|| crate::Error::Protocol("Failed to create image buffer".to_string()))?;

    let mut jpeg_data = Vec::new();

    // 使用 image crate 的 save 方法保存为 JPEG
    img
      .write_to(
        &mut std::io::Cursor::new(&mut jpeg_data),
        image::ImageFormat::Jpeg,
      )
      .map_err(|e| crate::Error::Protocol(format!("Failed to encode JPEG: {}", e)))?;

    Ok(jpeg_data)
  }
}
