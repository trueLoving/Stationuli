// 设备相关 API 调用

import { invoke } from "@tauri-apps/api/core";
import type { DeviceInfo } from "../types";

/**
 * 启动设备发现服务
 */
export async function startDiscovery(port: number): Promise<void> {
  return await invoke("start_discovery", { port });
}

/**
 * 停止设备发现服务
 */
export async function stopDiscovery(): Promise<void> {
  return await invoke("stop_discovery");
}

/**
 * 获取设备 ID
 */
export async function getDeviceId(): Promise<string> {
  return await invoke<string>("get_device_id");
}

/**
 * 获取本地 IP 地址
 */
export async function getLocalIp(): Promise<string> {
  return await invoke<string>("get_local_ip");
}

/**
 * 获取设备列表
 */
export async function getDevices(): Promise<DeviceInfo[]> {
  return await invoke<DeviceInfo[]>("get_devices");
}

/**
 * 添加设备
 */
export async function addDevice(device: DeviceInfo): Promise<void> {
  return await invoke("add_device", { device });
}

/**
 * 测试连接
 */
export async function testConnection(
  targetAddress: string,
  targetPort: number
): Promise<string> {
  return await invoke<string>("test_connection", {
    targetAddress,
    targetPort,
  });
}
