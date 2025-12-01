import React from "react";
import type { DeviceInfo } from "../../types";
import { DeviceItem } from "./DeviceItem";

export interface DeviceListProps {
  /** 设备列表 */
  devices: DeviceInfo[];
  /** 选择设备回调 */
  onSelectDevice?: (device: DeviceInfo) => void;
  /** 连接设备回调 */
  onConnect?: (device: DeviceInfo) => void;
}

/**
 * 设备列表组件
 * 可在 Tauri 和 React Native 中复用
 */
export function DeviceList({
  devices,
  onSelectDevice,
  onConnect,
}: DeviceListProps) {
  return (
    <div>
      {devices.map((device) => (
        <DeviceItem
          key={device.id}
          device={device}
          onSelect={onSelectDevice}
          onConnect={onConnect}
        />
      ))}
    </div>
  );
}
