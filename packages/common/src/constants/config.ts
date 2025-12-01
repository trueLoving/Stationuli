/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  /** 默认端口 */
  DEFAULT_PORT: 8080,
  /** 默认分片大小（1MB） */
  CHUNK_SIZE: 1024 * 1024,
  /** 连接超时时间（秒） */
  CONNECTION_TIMEOUT: 10,
  /** 传输超时时间（秒） */
  TRANSFER_TIMEOUT: 300,
} as const;

/**
 * 传输配置
 */
export const TRANSFER_CONFIG = {
  /** 最大并发传输数 */
  MAX_CONCURRENT_TRANSFERS: 5,
  /** 重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,
} as const;
