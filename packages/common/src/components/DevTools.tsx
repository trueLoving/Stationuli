// DevTools 组件 - 开发工具面板（桌面端和移动端公用）

import { Bug, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLogs, type LogEntry } from "../hooks/useLogs";

interface DevToolsProps {
  variant?: "mobile" | "desktop";
  isDev?: boolean;
}

export function DevTools({
  variant = "desktop",
  isDev = false,
}: DevToolsProps) {
  // 仅在开发模式下显示
  if (!isDev) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs">("logs");
  const { logs, clearLogs } = useLogs();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogEntry["level"] | "all">(
    "all"
  );
  const [filterSource, setFilterSource] = useState<
    "all" | "frontend" | "backend"
  >("all");
  const [searchText, setSearchText] = useState("");

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // 处理滚动事件，检测是否在底部
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    setAutoScroll(isAtBottom);
  };

  // 获取日志级别的样式
  const getLogLevelStyle = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      case "debug":
        return "text-gray-500";
      default:
        return "text-gray-700";
    }
  };

  // 获取日志级别的标签
  const getLogLevelLabel = (level: LogEntry["level"]) => {
    return level.toUpperCase();
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      //fractionalSecondDigits: 3,
    });
  };

  // 导出日志功能（暂时未使用，按钮已注释）
  // const exportLogs = () => {
  //   try {
  //     if (filteredLogs.length === 0) {
  //       console.warn("[DevTools] 没有可导出的日志");
  //       alert("没有可导出的日志");
  //       return;
  //     }
  //
  //     console.log(`[DevTools] 开始导出 ${filteredLogs.length} 条日志`);
  //
  //     const logText = filteredLogs
  //       .map((log) => {
  //         const time = formatTime(log.timestamp);
  //         const level = getLogLevelLabel(log.level);
  //         const source = log.source === "frontend" ? "前端" : "后端";
  //         return `[${time}] ${level} [${source}] ${log.message}`;
  //       })
  //       .join("\n");
  //
  //     console.log(`[DevTools] 日志文本长度: ${logText.length} 字符`);
  //
  //     // 使用 Blob 和下载链接
  //     const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
  //     const url = URL.createObjectURL(blob);
  //
  //     const a = document.createElement("a");
  //     a.href = url;
  //     const timestamp = new Date()
  //       .toISOString()
  //       .replace(/[:.]/g, "-")
  //       .slice(0, -5);
  //     a.download = `stationuli-logs-${timestamp}.txt`;
  //     a.style.display = "none";
  //     a.style.visibility = "hidden";
  //
  //     console.log(`[DevTools] 准备下载文件: ${a.download}`);
  //
  //     // 确保元素在 DOM 中
  //     document.body.appendChild(a);
  //
  //     // 触发点击
  //     console.log("[DevTools] 触发下载...");
  //     a.click();
  //
  //     // 延迟清理，确保下载已开始
  //     setTimeout(() => {
  //       if (a.parentNode) {
  //         document.body.removeChild(a);
  //       }
  //       URL.revokeObjectURL(url);
  //       console.log("[DevTools] 导出完成，已清理资源");
  //     }, 200);
  //   } catch (error) {
  //     console.error("[DevTools] 导出日志失败:", error);
  //     const errorMessage =
  //       error instanceof Error ? error.message : String(error);
  //     console.error("[DevTools] 错误详情:", error);
  //     alert(`导出日志失败: ${errorMessage}`);
  //   }
  // };

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    // 按级别过滤
    if (filterLevel !== "all" && log.level !== filterLevel) {
      return false;
    }
    // 按来源过滤
    if (filterSource !== "all" && log.source !== filterSource) {
      return false;
    }
    // 按搜索文本过滤
    if (
      searchText &&
      !log.message.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const isMobile = variant === "mobile";

  return (
    <>
      {/* 右下角图标按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed z-50 flex items-center justify-center
          ${isMobile ? "bottom-20 right-4" : "bottom-4 right-4"}
          w-12 h-12 rounded-full
          bg-white hover:bg-gray-50
          text-gray-700 shadow-lg border border-gray-200
          transition-all duration-200
          ${isOpen ? "bg-gray-50" : ""}
        `}
        aria-label="打开开发工具"
        title="开发工具"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* 面板 */}
      {isOpen && (
        <div
          className={`
            fixed z-50
            ${isMobile ? "bottom-32 right-4 left-4" : "bottom-4 right-4"}
            ${isMobile ? "top-4" : "top-auto"}
            ${isMobile ? "h-auto max-h-[calc(100vh-8rem)]" : "h-[600px]"}
            ${isMobile ? "w-auto" : "w-[800px]"}
            bg-white border border-gray-200 rounded-lg
            shadow-2xl flex flex-col
          `}
        >
          {/* 面板头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-800">开发工具</h2>
            </div>
            <div className="flex items-center gap-2">
              {/*<button
                onClick={exportLogs}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                title="导出日志"
              >
                <Download className="w-4 h-4" />
                导出
              </button>*/}
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                清空
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 标签页 */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("logs")}
              className={`
                px-4 py-2 text-sm font-medium transition-colors
                ${
                  activeTab === "logs"
                    ? "text-blue-600 border-b-2 border-blue-500"
                    : "text-gray-600 hover:text-gray-900"
                }
              `}
            >
              日志
            </button>
          </div>

          {/* 过滤和搜索栏 */}
          {activeTab === "logs" && (
            <div className="p-3 border-b border-gray-200 bg-gray-50 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {/* 级别过滤 */}
                <select
                  value={filterLevel}
                  onChange={(e) =>
                    setFilterLevel(e.target.value as LogEntry["level"] | "all")
                  }
                  className="px-2 py-1 text-xs bg-white text-gray-700 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">所有级别</option>
                  <option value="error">错误</option>
                  <option value="warn">警告</option>
                  <option value="info">信息</option>
                  <option value="log">日志</option>
                  <option value="debug">调试</option>
                </select>

                {/* 来源过滤 */}
                <select
                  value={filterSource}
                  onChange={(e) =>
                    setFilterSource(
                      e.target.value as "all" | "frontend" | "backend"
                    )
                  }
                  className="px-2 py-1 text-xs bg-white text-gray-700 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">所有来源</option>
                  <option value="frontend">前端</option>
                  <option value="backend">后端</option>
                </select>

                {/* 搜索框 */}
                <input
                  type="text"
                  placeholder="搜索日志..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1 min-w-[150px] px-2 py-1 text-xs bg-white text-gray-700 rounded border border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* 日志内容 */}
          {activeTab === "logs" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 日志列表 */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs bg-white"
                onScroll={handleScroll}
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    {logs.length === 0 ? "暂无日志" : "没有匹配的日志"}
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 py-1 hover:bg-gray-50 rounded px-2"
                    >
                      <span className="text-gray-500 text-[10px] flex-shrink-0 w-16">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className={`flex-shrink-0 w-12 text-[10px] ${getLogLevelStyle(
                          log.level
                        )}`}
                      >
                        {getLogLevelLabel(log.level)}
                      </span>
                      <span className="text-gray-600 flex-shrink-0 w-20 text-[10px]">
                        [{log.source}]
                      </span>
                      <span
                        className={`flex-1 break-words ${getLogLevelStyle(
                          log.level
                        )}`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* 底部信息栏 */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                <span>
                  共 {logs.length} 条日志
                  {filteredLogs.length !== logs.length &&
                    ` (显示 ${filteredLogs.length} 条)`}
                </span>
                {!autoScroll && (
                  <button
                    onClick={() => {
                      setAutoScroll(true);
                      logsEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <ChevronDown className="w-4 h-4" />
                    滚动到底部
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
