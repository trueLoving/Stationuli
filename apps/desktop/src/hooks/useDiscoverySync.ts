// Hook 用于同步设备发现状态到 store
import { useEffect } from "react";
import { deviceApiAdapter } from "../api/deviceAdapter";
import { useDiscoveryStore } from "../stores/discoveryStore";

/**
 * 同步设备发现状态到 store
 * 这个 hook 会定期刷新设备列表，并在服务启动/停止时更新状态
 */
export function useDiscoverySync() {
  const { isDiscovering, refreshDevices, setDeviceId, setLocalIp } =
    useDiscoveryStore();

  // 定期刷新设备列表（当服务运行时）
  useEffect(() => {
    if (!isDiscovering) {
      return;
    }

    // 立即刷新一次
    refreshDevices();

    // 设置定时刷新（每 3 秒）
    const interval = setInterval(() => {
      refreshDevices();
    }, 3000);

    return () => clearInterval(interval);
  }, [isDiscovering, refreshDevices]);

  // 当服务启动时，获取设备 ID 和本地 IP
  useEffect(() => {
    if (!isDiscovering) {
      return;
    }

    const updateDeviceInfo = async () => {
      try {
        const deviceId = await deviceApiAdapter.getDeviceId();
        const localIp = await deviceApiAdapter.getLocalIp();
        setDeviceId(deviceId);
        setLocalIp(localIp);
      } catch (error) {
        console.error("Failed to update device info:", error);
      }
    };

    updateDeviceInfo();
  }, [isDiscovering, setDeviceId, setLocalIp]);
}
