/**
 * 验证设备 ID
 */
export function isValidDeviceId(deviceId: string): boolean {
  // 设备 ID 应该是非空字符串
  return typeof deviceId === "string" && deviceId.length > 0;
}

/**
 * 验证 IP 地址
 */
export function isValidIpAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split(".").map(Number);
  return parts.every((part) => part >= 0 && part <= 255);
}

/**
 * 验证端口号
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}
