// 文件传输相关 Hook - 使用 stationuli-common 的 useFileTransfer
import { useFileTransfer as useFileTransferCommon } from "stationuli-common/hooks/useFileTransfer";
import { fileApiAdapter } from "../api/fileAdapter";

export function useFileTransfer() {
  return useFileTransferCommon({
    fileApi: fileApiAdapter,
  });
}
