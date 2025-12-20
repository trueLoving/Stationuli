// 共用类型定义

export interface DeviceInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  device_type: string;
}

export type TabType = "transfer" | "control";

export interface ReceivedFile {
  name: string;
  path: string;
  size?: number; // 文件大小（字节）
  receivedAt?: number; // 接收时间戳（毫秒）
  sender?: string; // 发送方信息（IP地址或设备名称）
}

export * from "./transfer";
