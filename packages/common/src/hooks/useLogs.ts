// 日志收集 Hook - 收集前端和后端日志

import { useCallback, useEffect, useRef, useState } from "react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: "log" | "info" | "warn" | "error" | "debug";
  source: "frontend" | "backend";
  message: string;
}

// 清理 ANSI 转义码
function stripAnsiCodes(text: string): string {
  // 匹配 ANSI 转义序列：\x1b[ 或 \u001b[ 后跟数字和字母
  return text
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

// 检查是否在 Tauri 环境中
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const maxLogs = useRef(1000); // 最多保存 1000 条日志
  const logIdCounter = useRef(0);

  // 添加日志
  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => {
      const newLog: LogEntry = {
        ...entry,
        id: `log-${logIdCounter.current++}`,
        timestamp: new Date(),
      };
      const updated = [...prev, newLog];
      // 如果超过最大数量，删除最旧的
      if (updated.length > maxLogs.current) {
        return updated.slice(-maxLogs.current);
      }
      return updated;
    });
  }, []);

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 拦截前端 console 方法
  useEffect(() => {
    if (!isTauri) return;

    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    console.log = (...args: unknown[]) => {
      originalLog.apply(console, args);
      addLog({
        level: "log",
        source: "frontend",
        message: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      });
    };

    console.info = (...args: unknown[]) => {
      originalInfo.apply(console, args);
      addLog({
        level: "info",
        source: "frontend",
        message: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      });
    };

    console.warn = (...args: unknown[]) => {
      originalWarn.apply(console, args);
      addLog({
        level: "warn",
        source: "frontend",
        message: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      });
    };

    console.error = (...args: unknown[]) => {
      originalError.apply(console, args);
      addLog({
        level: "error",
        source: "frontend",
        message: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      });
    };

    console.debug = (...args: unknown[]) => {
      originalDebug.apply(console, args);
      addLog({
        level: "debug",
        source: "frontend",
        message: args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" "),
      });
    };

    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
      console.debug = originalDebug;
    };
  }, [addLog]);

  // 监听后端日志事件
  useEffect(() => {
    if (!isTauri) return;

    const setupBackendLogListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");

        const unlisten = await listen<string>("log-message", (event) => {
          const message = event.payload;

          // 解析日志级别（从消息中提取）
          let level: LogEntry["level"] = "info";
          if (message.includes("ERROR") || message.includes("❌")) {
            level = "error";
          } else if (message.includes("WARN") || message.includes("⚠️")) {
            level = "warn";
          } else if (message.includes("DEBUG")) {
            level = "debug";
          } else if (
            message.includes("INFO") ||
            message.includes("✅") ||
            message.includes("🚀")
          ) {
            level = "info";
          }

          // 清理 ANSI 转义码
          const cleanMessage = stripAnsiCodes(message);

          addLog({
            level,
            source: "backend",
            message: cleanMessage,
          });
        });

        return unlisten;
      } catch (error) {
        console.error("Failed to setup backend log listener:", error);
        return () => {};
      }
    };

    let unlistenFn: (() => void) | undefined;

    setupBackendLogListener().then((unlisten) => {
      unlistenFn = unlisten;
    });

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [addLog]);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
