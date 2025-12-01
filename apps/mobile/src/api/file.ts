// 文件相关 API 调用

import { invoke } from "@tauri-apps/api/core";

/**
 * 选择文件（Android 专用）
 */
export async function selectFileAndroid(): Promise<{
  uri: string;
  name: string;
} | null> {
  return await invoke<{ uri: string; name: string } | null>(
    "select_file_android"
  );
}

/**
 * 获取文件名
 */
export async function getFileName(filePath: string): Promise<string> {
  return await invoke<string>("get_file_name", { filePath });
}

/**
 * 获取文件大小
 */
export async function getFileSize(filePath: string): Promise<number> {
  return await invoke<number>("get_file_size", { filePath });
}

/**
 * 发送文件
 */
export async function sendFile(
  filePath: string,
  targetAddress: string,
  targetPort: number
): Promise<string> {
  return await invoke<string>("send_file", {
    filePath,
    targetAddress,
    targetPort,
  });
}

/**
 * 保存接收的文件
 */
export async function saveReceivedFile(
  filePath: string,
  fileName: string
): Promise<string> {
  return await invoke<string>("save_received_file", {
    filePath,
    fileName,
  });
}
