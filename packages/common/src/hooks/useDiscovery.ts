// 设备发现相关 Hook（通用版本，接受 API 作为参数）

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  // 防抖定时器引用
  const startDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const stopDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  const startDiscovery = useCallback(async () => {
    // 如果正在启动或停止，忽略请求
    if (isStartingRef.current || isStoppingRef.current || isLoading) {
      return;
    }

    // 如果服务已经在运行，忽略请求
    if (isDiscovering) {
      return;
    }

    // 清除之前的防抖定时器
    if (startDebounceTimerRef.current) {
      clearTimeout(startDebounceTimerRef.current);
    }

    // 设置防抖：500ms 内只执行一次
    startDebounceTimerRef.current = setTimeout(async () => {
      if (isStartingRef.current || isStoppingRef.current || isDiscovering) {
        return;
      }

      isStartingRef.current = true;
      setIsLoading(true);

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
        setIsDiscovering(false);
      } finally {
        isStartingRef.current = false;
        setIsLoading(false);
      }
    }, 500);
  }, [deviceApi, defaultPort, isDiscovering, isLoading]);

  const stopDiscovery = useCallback(async () => {
    // 如果正在启动或停止，忽略请求
    if (isStartingRef.current || isStoppingRef.current || isLoading) {
      return;
    }

    // 如果服务已经停止，忽略请求
    if (!isDiscovering) {
      return;
    }

    // 清除之前的防抖定时器
    if (stopDebounceTimerRef.current) {
      clearTimeout(stopDebounceTimerRef.current);
    }

    // 设置防抖：500ms 内只执行一次
    stopDebounceTimerRef.current = setTimeout(async () => {
      if (isStartingRef.current || isStoppingRef.current || !isDiscovering) {
        return;
      }

      isStoppingRef.current = true;
      setIsLoading(true);

      try {
        // 添加超时保护，防止无限等待
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("停止服务超时（5秒）")), 5000);
        });

        await Promise.race([deviceApi.stopDiscovery(), timeoutPromise]);

        // 成功停止后更新状态
        setIsDiscovering(false);
        setDevices([]);
        setDeviceId("");
        setLocalIp("");
      } catch (error) {
        console.error("Failed to stop service:", error);
        const errorMsg = String(error);
        alert(`停止服务失败: ${errorMsg}`);

        // 即使出错，也尝试更新状态，避免界面卡住
        // 因为后端可能已经部分停止了服务
        setIsDiscovering(false);
        setDevices([]);
        setDeviceId("");
        setLocalIp("");
      } finally {
        isStoppingRef.current = false;
        setIsLoading(false);
      }
    }, 500);
  }, [deviceApi, isDiscovering, isLoading]);

  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await deviceApi.getDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error("Failed to get devices:", error);
    }
  }, [deviceApi]);

  const addDevice = useCallback(
    async (
      address: string,
      port: number,
      name?: string,
      deviceType?: string,
      deviceId?: string
    ) => {
      const device: DeviceInfo = {
        id: deviceId || `manual-${Date.now()}`,
        name: name || `手动添加的设备 (${address}:${port})`,
        address,
        port,
        device_type: deviceType || "unknown",
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

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (startDebounceTimerRef.current) {
        clearTimeout(startDebounceTimerRef.current);
      }
      if (stopDebounceTimerRef.current) {
        clearTimeout(stopDebounceTimerRef.current);
      }
    };
  }, []);

  return {
    devices,
    isDiscovering,
    deviceId,
    localIp,
    isLoading,
    startDiscovery,
    stopDiscovery,
    refreshDevices,
    addDevice,
    setDevices,
  };
}
