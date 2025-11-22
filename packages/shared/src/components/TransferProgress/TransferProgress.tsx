import React from "react";
import type { TransferInfo } from "../../types";

export interface TransferProgressProps {
  /** 传输信息 */
  transfer: TransferInfo;
}

/**
 * 传输进度组件
 */
export function TransferProgress({ transfer }: TransferProgressProps) {
  const progress =
    transfer.fileSize > 0
      ? (transfer.transferred / transfer.fileSize) * 100
      : 0;

  return (
    <div>
      <div>{transfer.fileName}</div>
      <div>
        <progress value={progress} max={100} />
        <span>{progress.toFixed(1)}%</span>
      </div>
      <div>
        {formatBytes(transfer.transferred)} / {formatBytes(transfer.fileSize)}
      </div>
      {transfer.speed && <div>速度: {formatBytes(transfer.speed)}/s</div>}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
