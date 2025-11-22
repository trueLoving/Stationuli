import { useState, useEffect } from "react";
import type { DeviceInfo } from "../types";

/**
 * 设备发现 Hook
 *
 * 注意：实际实现需要根据平台调用不同的 API
 * - PC 端：通过 Tauri 调用 Rust
 * - Android 端：通过 Native Module 调用 Rust
 */
export function useDeviceDiscovery() {
  const [devices] = useState<DeviceInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    // TODO: 实现设备发现逻辑
    // PC 端：await invoke('discover_devices')
    // Android 端：await StationuliModule.discoverDevices()
  }, []);

  const startDiscovery = async () => {
    setIsDiscovering(true);
    // TODO: 实现开始发现
  };

  const stopDiscovery = () => {
    setIsDiscovering(false);
    // TODO: 实现停止发现
  };

  return {
    devices,
    isDiscovering,
    startDiscovery,
    stopDiscovery,
  };
}
