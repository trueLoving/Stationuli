// API 调用层 - 需要在各应用中实现具体的 invoke 调用
// 这里只定义接口类型，不包含具体实现

import type { DeviceInfo } from "../types";

export interface DeviceApi {
  startDiscovery(port: number): Promise<void>;
  stopDiscovery(): Promise<void>;
  getDeviceId(): Promise<string>;
  getLocalIp(): Promise<string>;
  getDevices(): Promise<DeviceInfo[]>;
  addDevice(device: DeviceInfo): Promise<void>;
  testConnection(targetAddress: string, targetPort: number): Promise<string>;
}

export interface FileApi {
  selectFile(): Promise<string | null>;
  getFileName(filePath: string): Promise<string>;
  getFileSize(filePath: string): Promise<number>;
  sendFile(
    filePath: string,
    targetAddress: string,
    targetPort: number
  ): Promise<string>;
  saveReceivedFile(filePath: string, fileName: string): Promise<string>;
}

// 用于移动端的特殊文件选择器接口
export interface MobileFileApi extends FileApi {
  selectFileAndroid?(): Promise<{ uri: string; name: string } | null>;
}
