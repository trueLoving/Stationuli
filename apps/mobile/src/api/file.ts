// 文件相关 API 调用

import { invoke } from "@tauri-apps/api/core";

/**
 * 权限状态
 */
export enum PermissionStatus {
  /** 已获取持久化权限 */
  Persistable = "Persistable",
  /** 仅临时权限（需要重新获取） */
  Temporary = "Temporary",
  /** 权限未知或已失效 */
  Unknown = "Unknown",
}

/**
 * 文件信息结构（增强版）
 */
export interface FileInfo {
  /** Content URI */
  uri: string;
  /** 文件名（包含扩展名） */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  mime_type?: string;
  /** 文件扩展名 */
  extension?: string;
  /** 权限状态 */
  permission_status: PermissionStatus;
}

/**
 * 文件选择选项
 */
export interface FileSelectOptions {
  /** 是否允许多选 */
  multiple?: boolean;
  /** MIME 类型过滤（可选，默认所有类型） */
  mime_types?: string[];
  /** 最大文件大小限制（可选，字节） */
  max_size?: number;
}

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

/**
 * 选择文件（Android 专用，增强版）
 * 返回完整的 FileInfo 结构，包含文件大小、MIME类型、权限状态等
 */
export async function selectFileAndroidV2(
  options?: FileSelectOptions
): Promise<FileInfo[] | null> {
  try {
    const result = await invoke<FileInfo[] | null>("select_file_android_v2", {
      options: options || {},
    });
    return result;
  } catch (error) {
    console.error("Failed to select file (v2):", error);
    throw error;
  }
}

/**
 * 流式发送文件（避免大文件内存溢出）
 * 使用 FileInfo 结构，支持流式读取和传输
 */
export async function sendFileStreaming(
  fileInfo: FileInfo,
  targetAddress: string,
  targetPort: number
): Promise<string> {
  return await invoke<string>("send_file_streaming", {
    fileInfo,
    targetAddress,
    targetPort,
  });
}
