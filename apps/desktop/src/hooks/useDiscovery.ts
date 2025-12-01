// 设备发现相关 Hook - 使用 stationuli-common 的 useDiscovery

import { useDiscovery as useDiscoveryCommon } from "stationuli-common/hooks/useDiscovery";
import { deviceApiAdapter } from "../api/deviceAdapter";
import { DEFAULT_PORT } from "../constants";

export function useDiscovery() {
  return useDiscoveryCommon({
    deviceApi: deviceApiAdapter,
    defaultPort: DEFAULT_PORT,
  });
}
