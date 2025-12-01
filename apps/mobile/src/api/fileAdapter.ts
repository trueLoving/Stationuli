// 文件 API 适配器 - 将移动端的 API 调用适配为 common 的 FileApi 接口

import type { FileApi } from "stationuli-common/api";
import * as fileApi from "./file";

export const fileApiAdapter: FileApi = {
  async selectFile(): Promise<string | null> {
    // 移动端使用 Android 专用选择器，这里返回 null 让 useFileTransfer 处理
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

// Android 专用文件选择器
export async function selectFileAndroid(): Promise<{
  uri: string;
  name: string;
} | null> {
  return await fileApi.selectFileAndroid();
}
