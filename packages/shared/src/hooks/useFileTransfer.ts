import { useState } from "react";
import type { TransferInfo } from "../types";

/**
 * 文件传输 Hook
 */
export function useFileTransfer() {
  const [transfers, setTransfers] = useState<TransferInfo[]>([]);

  const sendFile = async (
    filePath: string,
    targetDeviceId: string
  ): Promise<string> => {
    // TODO: 实现文件发送
    // PC 端：await invoke('send_file', { filePath, targetDeviceId })
    // Android 端：await StationuliModule.sendFile(filePath, targetDeviceId)
    const transferId = `transfer-${Date.now()}`;
    return transferId;
  };

  const cancelTransfer = async (transferId: string): Promise<void> => {
    // TODO: 实现取消传输
  };

  const getTransfer = (transferId: string): TransferInfo | undefined => {
    return transfers.find((t) => t.id === transferId);
  };

  return {
    transfers,
    sendFile,
    cancelTransfer,
    getTransfer,
  };
}
