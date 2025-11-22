/**
 * 文件传输状态
 */
export enum TransferStatus {
  /** 等待中 */
  Pending = "pending",
  /** 传输中 */
  Transferring = "transferring",
  /** 已完成 */
  Completed = "completed",
  /** 已失败 */
  Failed = "failed",
  /** 已取消 */
  Cancelled = "cancelled",
}

/**
 * 文件传输信息
 */
export interface TransferInfo {
  /** 传输 ID */
  id: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 已传输大小（字节） */
  transferred: number;
  /** 传输状态 */
  status: TransferStatus;
  /** 发送端设备 ID */
  senderId: string;
  /** 接收端设备 ID */
  receiverId: string;
  /** 开始时间 */
  startTime: number;
  /** 完成时间 */
  endTime?: number;
  /** 传输速度（字节/秒） */
  speed?: number;
  /** 错误信息 */
  error?: string;
}
