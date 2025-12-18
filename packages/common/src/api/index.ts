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
  removeDevice(deviceId: string): Promise<void>;
  updateDevice(device: DeviceInfo): Promise<void>;
  testConnection(targetAddress: string, targetPort: number): Promise<string>;
}

export interface FileApi {
  /**
   * 选择文件
   * 桌面端返回文件路径字符串，移动端可以返回包含 uri 和 name 的对象
   * @returns 文件路径字符串，或包含 uri 和 name 的对象，或 null（用户取消）
   */
  selectFile(): Promise<string | { uri: string; name: string } | null>;
  getFileName(filePath: string): Promise<string>;
  getFileSize(filePath: string): Promise<number>;
  sendFile(
    filePath: string,
    targetAddress: string,
    targetPort: number
  ): Promise<string>;
  saveReceivedFile(filePath: string, fileName: string): Promise<string>;
}
