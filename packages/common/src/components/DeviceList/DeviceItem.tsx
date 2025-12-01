import React from "react";
import type { DeviceInfo } from "../../types";

export interface DeviceItemProps {
  /** 设备信息 */
  device: DeviceInfo;
  /** 选择回调 */
  onSelect?: (device: DeviceInfo) => void;
  /** 连接回调 */
  onConnect?: (device: DeviceInfo) => void;
}

/**
 * 设备项组件
 */
export function DeviceItem({ device, onSelect, onConnect }: DeviceItemProps) {
  return (
    <div onClick={() => onSelect?.(device)}>
      <div>{device.name}</div>
      <div>
        {device.address}:{device.port}
      </div>
      {!device.connected && (
        <button onClick={() => onConnect?.(device)}>连接</button>
      )}
    </div>
  );
}
