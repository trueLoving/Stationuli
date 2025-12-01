import { create } from "zustand";
import type { DeviceInfo } from "../types";

interface DeviceState {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (device: DeviceInfo) => void;
  selectDevice: (device: DeviceInfo | null) => void;
  clearDevices: () => void;
}

/**
 * 设备状态管理 Store
 */
export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  selectedDevice: null,

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices.filter((d) => d.id !== device.id), device],
    })),

  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
      selectedDevice:
        state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
    })),

  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === device.id ? device : d)),
    })),

  selectDevice: (device) => set({ selectedDevice: device }),

  clearDevices: () => set({ devices: [], selectedDevice: null }),
}));
