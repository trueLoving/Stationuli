// 设备发现相关 Hook（通用版本，接受 API 作为参数）

import { useCallback, useState } from "react";
import type { DeviceApi } from "../api";
import type { DeviceInfo } from "../types";

interface UseDiscoveryOptions {
  deviceApi: DeviceApi;
  defaultPort: number;
}

export function useDiscovery({ deviceApi, defaultPort }: UseDiscoveryOptions) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [localIp, setLocalIp] = useState<string>("");

  const startDiscovery = useCallback(async () => {
    try {
      await deviceApi.startDiscovery(defaultPort);
      setIsDiscovering(true);

      // 获取设备 ID
      const id = await deviceApi.getDeviceId();
      setDeviceId(id);

      // 获取本地 IP 地址
      try {
        const ip = await deviceApi.getLocalIp();
        setLocalIp(ip);
      } catch (error) {
        console.error("Failed to get local IP:", error);
        setLocalIp("未知");
      }
    } catch (error) {
      console.error("Failed to start service:", error);
      alert(`启动服务失败: ${error}`);
    }
  }, [deviceApi, defaultPort]);

  const stopDiscovery = useCallback(async () => {
    try {
      await deviceApi.stopDiscovery();
      setIsDiscovering(false);
      setDevices([]);
    } catch (error) {
      console.error("Failed to stop service:", error);
    }
  }, [deviceApi]);

  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await deviceApi.getDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error("Failed to get devices:", error);
    }
  }, [deviceApi]);

  const addDevice = useCallback(
    async (address: string, port: number) => {
      const device: DeviceInfo = {
        id: `manual-${Date.now()}`,
        name: `手动添加的设备 (${address}:${port})`,
        address,
        port,
        device_type: "unknown",
      };

      try {
        await deviceApi.addDevice(device);
        await refreshDevices();
        return device;
      } catch (error) {
        console.error("Failed to add device:", error);
        throw error;
      }
    },
    [deviceApi, refreshDevices]
  );

  return {
    devices,
    isDiscovering,
    deviceId,
    localIp,
    startDiscovery,
    stopDiscovery,
    refreshDevices,
    addDevice,
    setDevices,
  };
}
