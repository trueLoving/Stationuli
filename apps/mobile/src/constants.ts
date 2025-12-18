// 常量定义
export const DEFAULT_PORT = 8081; // 移动端端口（与桌面端不同）

export const FILE_FILTERS = [
  {
    name: "所有文件",
    extensions: ["*"],
  },
  {
    name: "图片",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
  },
  {
    name: "视频",
    extensions: ["mp4", "avi", "mov", "mkv", "webm", "flv"],
  },
  {
    name: "音频",
    extensions: ["mp3", "wav", "flac", "aac", "ogg", "m4a"],
  },
  {
    name: "文档",
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"],
  },
] as const;
