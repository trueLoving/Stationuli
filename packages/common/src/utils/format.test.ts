import { describe, expect, it } from "vitest";
import { formatBytes, formatSpeed, formatTime } from "./format";

describe("formatBytes", () => {
  it("应该正确格式化字节数", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.00 GB");
    expect(formatBytes(1536)).toBe("1.50 KB");
  });

  it("应该处理小数", () => {
    // 512 字节小于 1024，所以应该显示为 B
    expect(formatBytes(512)).toBe("512.00 B");
    // 1536 KB = 1.5 MB
    expect(formatBytes(1536 * 1024)).toBe("1.50 MB");
    // 768 KB = 0.75 MB
    expect(formatBytes(768 * 1024)).toBe("768.00 KB");
  });
});

describe("formatSpeed", () => {
  it("应该正确格式化传输速度", () => {
    expect(formatSpeed(1024)).toBe("1.00 KB/s");
    expect(formatSpeed(1024 * 1024)).toBe("1.00 MB/s");
    expect(formatSpeed(0)).toBe("0 B/s");
  });
});

describe("formatTime", () => {
  it("应该正确格式化时间（秒）", () => {
    expect(formatTime(0)).toBe("0秒");
    expect(formatTime(30)).toBe("30秒");
    expect(formatTime(59)).toBe("59秒");
  });

  it("应该正确格式化时间（分钟）", () => {
    expect(formatTime(60)).toBe("1分0秒");
    expect(formatTime(90)).toBe("1分30秒");
    expect(formatTime(3599)).toBe("59分59秒");
  });

  it("应该正确格式化时间（小时）", () => {
    expect(formatTime(3600)).toBe("1小时0分");
    expect(formatTime(3660)).toBe("1小时1分");
    expect(formatTime(7320)).toBe("2小时2分");
  });
});
