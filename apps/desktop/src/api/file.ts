// 文件相关 API 调用

import { invoke } from "@tauri-apps/api/core";

/**
 * 选择文件（支持多选）
 */
export async function selectFile(
  multiple: boolean = false
): Promise<string | string[] | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple,
    directory: false,
  });
  if (!selected) {
    return null;
  }
  if (multiple) {
    return Array.isArray(selected) ? selected : [];
  }
  return typeof selected === "string" ? selected : null;
}

/**
 * 获取文件名
 */
export async function getFileName(filePath: string): Promise<string> {
  // 桌面端直接从路径提取文件名
  return filePath.split("/").pop() || filePath.split("\\").pop() || "未知文件";
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
