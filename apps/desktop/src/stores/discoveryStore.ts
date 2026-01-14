// 设备发现全局状态管理
import { create } from "zustand";
import * as deviceApi from "../api/device";
import { deviceApiAdapter } from "../api/deviceAdapter";
import { DEFAULT_PORT } from "../constants";
import type { DeviceInfo } from "../types";

interface DiscoveryState {
  // 状态
  devices: DeviceInfo[];
  isDiscovering: boolean;
  deviceId: string;
  localIp: string;
  isLoading: boolean;

  // 方法
  setDevices: (devices: DeviceInfo[]) => void;
  setIsDiscovering: (isDiscovering: boolean) => void;
  setDeviceId: (deviceId: string) => void;
  setLocalIp: (localIp: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => Promise<void>;
  addDevice: (
    address: string,
    port: number,
    name?: string,
    deviceType?: string,
    deviceId?: string
  ) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  updateDevice: (device: DeviceInfo) => Promise<void>;
  testConnection: (address: string, port: number) => Promise<string>;
  refreshDevices: () => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  // 初始状态
  devices: [],
  isDiscovering: false,
  deviceId: "",
  localIp: "",
  isLoading: false,

  // Setters
  setDevices: (devices) => set({ devices }),
  setIsDiscovering: (isDiscovering) => set({ isDiscovering }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setLocalIp: (localIp) => set({ localIp }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // 启动设备发现
  startDiscovery: async () => {
    const state = get();
    if (state.isLoading || state.isDiscovering) {
      return;
    }

    set({ isLoading: true });
    try {
      await deviceApiAdapter.startDiscovery(DEFAULT_PORT);
      const deviceId = await deviceApiAdapter.getDeviceId();
      const localIp = await deviceApiAdapter.getLocalIp();
      set({
        isDiscovering: true,
        deviceId,
        localIp,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to start discovery:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // 停止设备发现
  stopDiscovery: async () => {
    const state = get();
    if (state.isLoading || !state.isDiscovering) {
      return;
    }

    set({ isLoading: true });
    try {
      await deviceApiAdapter.stopDiscovery();
      set({
        isDiscovering: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to stop discovery:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // 刷新设备列表
  refreshDevices: async () => {
    try {
      const devices = await deviceApiAdapter.getDevices();
      set({ devices });
    } catch (error) {
      console.error("Failed to refresh devices:", error);
    }
  },

  // 添加设备
  addDevice: async (address, port, name, deviceType, deviceId) => {
    const device: DeviceInfo = {
      id: deviceId || `${address}:${port}`,
      name: name || `设备 ${address}:${port}`,
      address,
      port,
      device_type: deviceType || "unknown",
    };
    await deviceApiAdapter.addDevice(device);
    // 刷新设备列表
    const state = get();
    await state.refreshDevices();
  },

  // 删除设备
  removeDevice: async (deviceId) => {
    await deviceApiAdapter.removeDevice(deviceId);
    // 刷新设备列表
    const state = get();
    await state.refreshDevices();
  },

  // 更新设备
  updateDevice: async (device) => {
    await deviceApiAdapter.updateDevice(device);
    // 刷新设备列表
    const state = get();
    await state.refreshDevices();
  },

  // 测试连接
  testConnection: async (address, port) => {
    return await deviceApi.testConnection(address, port);
  },
}));
