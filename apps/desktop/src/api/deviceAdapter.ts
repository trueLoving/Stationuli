// 设备 API 适配器 - 将桌面端的 API 调用适配为 common 的 DeviceApi 接口

import type { DeviceApi } from "stationuli-common/api";
import type { DeviceInfo } from "stationuli-common/types";
import * as deviceApi from "./device";

export const deviceApiAdapter: DeviceApi = {
  async startDiscovery(port: number): Promise<void> {
    await deviceApi.startDiscovery(port);
  },
  async stopDiscovery(): Promise<void> {
    await deviceApi.stopDiscovery();
  },
  async getDeviceId(): Promise<string> {
    return await deviceApi.getDeviceId();
  },
  async getLocalIp(): Promise<string> {
    return await deviceApi.getLocalIp();
  },
  async getDevices(): Promise<DeviceInfo[]> {
    return await deviceApi.getDevices();
  },
  async addDevice(device: DeviceInfo): Promise<void> {
    return await deviceApi.addDevice(device);
  },
  async removeDevice(deviceId: string): Promise<void> {
    return await deviceApi.removeDevice(deviceId);
  },
  async updateDevice(device: DeviceInfo): Promise<void> {
    return await deviceApi.updateDevice(device);
  },
  async testConnection(
    targetAddress: string,
    targetPort: number
  ): Promise<string> {
    return await deviceApi.testConnection(targetAddress, targetPort);
  },
};
