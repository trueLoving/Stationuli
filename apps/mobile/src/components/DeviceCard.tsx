// 设备卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { DeviceCard as DeviceCardCommon } from "stationuli-common/components/DeviceCard";
import type { DeviceInfo } from "../types";

interface DeviceCardProps {
  device: DeviceInfo;
  onTestConnection: (device: DeviceInfo) => void;
  onSendFile: (device: DeviceInfo) => void;
  showActions?: boolean;
}

export function DeviceCard(props: DeviceCardProps) {
  return <DeviceCardCommon {...props} variant="mobile" />;
}
