// 文件相关 API 调用

import { invoke } from "@tauri-apps/api/core";

/**
 * 选择文件（Android 专用，支持多选）
 */
export async function selectFileAndroid(multiple: boolean = false): Promise<
  | {
      uri: string;
      name: string;
    }
  | { uri: string; name: string }[]
  | null
> {
  const result = await invoke<
    { uri: string; name: string } | { uri: string; name: string }[] | null
  >("select_file_android", { multiple });
  return result;
}

/**
 * 选择文件（通用接口，支持多选）
 */
export async function selectFile(
  multiple: boolean = false
): Promise<string | string[] | null> {
  try {
    // 尝试使用 Android 专用文件选择器
    const androidSelected = await selectFileAndroid(multiple);
    if (!androidSelected) {
      return null;
    }

    if (Array.isArray(androidSelected)) {
      return androidSelected.map((f) => f.uri);
    }

    return androidSelected.uri;
  } catch (error) {
    // 如果 Android 专用选择器失败，回退到通用对话框
    console.log(
      "Android file picker not available, using generic dialog:",
      error
    );
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
