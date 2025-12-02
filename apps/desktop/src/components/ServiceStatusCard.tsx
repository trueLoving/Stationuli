// 服务状态卡片组件 - 从 stationuli-common 重新导出并设置默认 variant
import { ServiceStatusCard as ServiceStatusCardCommon } from "stationuli-common/components/ServiceStatusCard";
import { DEFAULT_PORT } from "../constants";

interface ServiceStatusCardProps {
  isDiscovering: boolean;
  deviceId: string;
  localIp: string;
  onStart: () => void;
  onStop: () => void;
  onAddDevice: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function ServiceStatusCard(props: ServiceStatusCardProps) {
  return (
    <ServiceStatusCardCommon
      {...props}
      defaultPort={DEFAULT_PORT}
      variant="desktop"
    />
  );
}
