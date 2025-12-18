// 文件 API 适配器 - 将移动端的 API 调用适配为 common 的 FileApi 接口
import type { FileApi } from "stationuli-common/api";
import type { FileInfo } from "./file";
import * as fileApi from "./file";
import { FILE_FILTERS } from "../constants";

export const fileApiAdapter: FileApi = {
  async selectFile(): Promise<string | { uri: string; name: string } | null> {
    // 移动端优先使用增强版文件选择器（v2）
    try {
      const fileInfos = await fileApi.selectFileAndroidV2({
        multiple: false,
      });
      if (fileInfos && fileInfos.length > 0) {
        const fileInfo = fileInfos[0];
        return {
          uri: fileInfo.uri,
          name: fileInfo.name,
        };
      }
    } catch (error) {
      console.log(
        "Enhanced file picker (v2) not available, falling back:",
        error
      );
    }

    // 回退到旧版本文件选择器
    try {
      const androidSelected = await fileApi.selectFileAndroid(false);
      if (androidSelected) {
        if (Array.isArray(androidSelected)) {
          return androidSelected.length > 0 ? androidSelected[0] : null;
        }
        return androidSelected;
      }
    } catch (error) {
      console.log(
        "Android file picker not available, using generic dialog:",
        error
      );
    }

    // 最后回退到通用对话框
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const genericSelected = (await open({
        multiple: false,
        directory: false,
        filters: FILE_FILTERS as any,
      })) as string | null;

      if (genericSelected) {
        return genericSelected;
      }
    } catch (error) {
      console.error("Failed to select file:", error);
    }

    return null;
  },
  async getFileName(filePath: string): Promise<string> {
    return await fileApi.getFileName(filePath);
  },
  async getFileSize(filePath: string): Promise<number> {
    return await fileApi.getFileSize(filePath);
  },
  async sendFile(
    filePath: string,
    targetAddress: string,
    targetPort: number
  ): Promise<string> {
    return await fileApi.sendFile(filePath, targetAddress, targetPort);
  },
  async saveReceivedFile(filePath: string, fileName: string): Promise<string> {
    return await fileApi.saveReceivedFile(filePath, fileName);
  },
};

// Android 专用文件选择器（旧版本，保持向后兼容）
export async function selectFileAndroid(): Promise<{
  uri: string;
  name: string;
} | null> {
  const result = await fileApi.selectFileAndroid(false);
  // 处理可能的数组情况（虽然传入 multiple=false 应该不会返回数组）
  if (Array.isArray(result)) {
    return result.length > 0 ? result[0] : null;
  }
  return result;
}

// Android 专用文件选择器（增强版）
export async function selectFileAndroidV2(
  options?: fileApi.FileSelectOptions
): Promise<FileInfo[] | null> {
  return await fileApi.selectFileAndroidV2(options);
}

// 流式发送文件
export async function sendFileStreaming(
  fileInfo: FileInfo,
  targetAddress: string,
  targetPort: number
): Promise<string> {
  return await fileApi.sendFileStreaming(fileInfo, targetAddress, targetPort);
}
