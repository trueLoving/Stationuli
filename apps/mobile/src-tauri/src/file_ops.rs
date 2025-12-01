// 文件操作工具函数（Android/iOS 特定）

/// 从 content:// URI 中尝试提取文件名（后备方法）
#[allow(dead_code)] // 在条件编译的代码中使用
pub fn get_file_name_from_uri(uri: &str) -> String {
  let uri_str = uri;

  // 如果 URI 包含文件名（通常在路径的最后部分）
  if let Some(last_part) = uri_str.split('/').last() {
    // 检查是否包含文件扩展名
    if last_part.contains('.') && !last_part.starts_with("msf:") {
      // 可能是文件名，尝试解码
      if let Ok(decoded) = urlencoding::decode(last_part) {
        let decoded_str = decoded.to_string();
        // 如果解码后的字符串看起来像文件名（包含扩展名且不太长）
        if decoded_str.len() < 200 && decoded_str.contains('.') {
          return decoded_str;
        }
      }
    }
  }

  // 如果无法从 URI 提取，尝试从 URI 中推断文件扩展名
  let uri_lower = uri_str.to_lowercase();
  let extension = if uri_lower.contains(".png") {
    "png"
  } else if uri_lower.contains(".jpg") || uri_lower.contains(".jpeg") {
    "jpg"
  } else if uri_lower.contains(".pdf") {
    "pdf"
  } else if uri_lower.contains(".mp4") {
    "mp4"
  } else if uri_lower.contains(".mp3") {
    "mp3"
  } else if uri_lower.contains(".txt") {
    "txt"
  } else if uri_lower.contains(".doc") || uri_lower.contains(".docx") {
    "docx"
  } else if uri_lower.contains(".xls") || uri_lower.contains(".xlsx") {
    "xlsx"
  } else {
    "bin"
  };

  // 返回一个描述性的文件名（作为最后的后备方案）
  format!("文件.{}", extension)
}
