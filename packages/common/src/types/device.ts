/**
 * 设备信息类型
 */
export interface DeviceInfo {
  /** 设备唯一标识 */
  id: string;
  /** 设备名称 */
  name: string;
  /** 设备地址 */
  address: string;
  /** 设备端口 */
  port: number;
  /** 设备类型 */
  type: DeviceType;
  /** 是否已连接 */
  connected: boolean;
  /** 最后更新时间 */
  lastSeen: number;
}

/**
 * 设备类型
 */
export enum DeviceType {
  /** PC 端 */
  Desktop = "desktop",
  /** 移动端 */
  Mobile = "mobile",
}
