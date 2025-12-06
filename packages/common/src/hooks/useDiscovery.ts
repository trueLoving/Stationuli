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
        console.log("[前端] 开始启动服务...");
        const startTime = Date.now();

        await deviceApi.startDiscovery(defaultPort);

        const discoveryDuration = Date.now() - startTime;
        console.log(`[前端] 服务启动成功，耗时: ${discoveryDuration}ms`);

        setIsDiscovering(true);

        // 获取设备 ID
        try {
          const id = await deviceApi.getDeviceId();
          setDeviceId(id);
          console.log("[前端] 设备 ID 获取成功:", id);
        } catch (error) {
          console.error("[前端] 获取设备 ID 失败:", error);
        }

        // 获取本地 IP 地址
        try {
          const ip = await deviceApi.getLocalIp();
          setLocalIp(ip);
          console.log("[前端] 本地 IP 获取成功:", ip);
        } catch (error) {
          console.error("[前端] 获取本地 IP 失败:", error);
          setLocalIp("未知");
        }
      } catch (error) {
        const errorMsg = String(error);
        const errorDetails = {
          error,
          message: errorMsg,
          type: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined,
        };

        console.error("[前端] 启动服务失败，错误详情:", errorDetails);
        console.error("[前端] 错误原因分析:", {
          isPortInUse: errorMsg.includes("port") || errorMsg.includes("端口"),
          isPermissionError:
            errorMsg.includes("permission") || errorMsg.includes("权限"),
          errorMessage: errorMsg,
          possibleReasons:
            errorMsg.includes("port") || errorMsg.includes("端口")
              ? ["端口可能已被占用", "请检查是否有其他服务在使用该端口"]
              : ["未知错误，请查看后端日志"],
        });

        alert(`启动服务失败: ${errorMsg}`);
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
        // 后端超时是60秒，这里设置为65秒，给后端一些缓冲时间
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error("停止服务超时（65秒）");
            console.error("[前端] 停止服务超时错误详情:", {
              error: timeoutError,
              message: "前端等待后端响应超时（65秒）",
              reason: "后端可能在60秒时已超时，但前端仍在等待响应",
              timestamp: new Date().toISOString(),
              stack: timeoutError.stack,
            });
            reject(timeoutError);
          }, 65000);
        });

        console.log("[前端] 开始停止服务，等待后端响应...");
        const startTime = Date.now();

        await Promise.race([deviceApi.stopDiscovery(), timeoutPromise]);

        const duration = Date.now() - startTime;
        console.log(`[前端] 停止服务成功，耗时: ${duration}ms`);

        // 成功停止后更新状态
        setIsDiscovering(false);
        setDevices([]);
        setDeviceId("");
        setLocalIp("");
      } catch (error) {
        const errorMsg = String(error);
        const errorDetails = {
          error,
          message: errorMsg,
          type: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined,
        };

        console.error("[前端] 停止服务失败，错误详情:", errorDetails);
        console.error("[前端] 错误原因分析:", {
          isTimeout: errorMsg.includes("超时"),
          isNetworkError:
            errorMsg.includes("network") || errorMsg.includes("连接"),
          errorMessage: errorMsg,
          possibleReasons: errorMsg.includes("超时")
            ? [
                "后端服务停止操作耗时超过60秒",
                "后端可能正在等待资源释放",
                "网络通信延迟",
                "后端服务可能已卡住",
              ]
            : ["未知错误，请查看后端日志"],
        });

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
