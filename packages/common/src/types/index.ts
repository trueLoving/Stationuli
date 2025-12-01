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
}
