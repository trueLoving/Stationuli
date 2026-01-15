// 移动端顶部标题栏组件
import { Copy, Play, Square } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Spinner } from "stationuli-common/components";

const pageTitles: Record<string, string> = {
  "/home": "首页",
  "/devices": "设备",
  "/history": "历史",
  "/settings": "设置",
};

interface MobileHeaderProps {
  isDiscovering: boolean;
  localIp: string;
  defaultPort: number;
  onStart: () => void;
  onStop: () => void;
  isLoading?: boolean;
}

export function MobileHeader({
  isDiscovering,
  localIp,
  defaultPort,
  onStart,
  onStop,
  isLoading = false,
}: MobileHeaderProps) {
  const location = useLocation();
  const [copiedIp, setCopiedIp] = useState(false);

  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || "首页";

  const handleCopyIp = async () => {
    const textToCopy = `${localIp}:${defaultPort}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-3">
      {/* 页面标题和启动按钮（服务未启动时） */}
      {!isDiscovering ? (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
          <button
            onClick={onStart}
            disabled={isLoading}
            className={`px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading ? "opacity-60" : ""
            }`}
            aria-label="启动服务"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>启动中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>启动服务</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* 服务启动后：标题、IP地址和停止按钮在同一行 */
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-gray-800 flex-shrink-0">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {localIp && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-xs font-mono text-blue-700 whitespace-nowrap">
                  {localIp}:{defaultPort}
                </span>
                <button
                  onClick={handleCopyIp}
                  className="p-1 text-blue-600 active:bg-blue-100 rounded transition-colors flex-shrink-0"
                  title={copiedIp ? "已复制" : "复制IP地址"}
                  aria-label="复制IP地址"
                >
                  {copiedIp ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✓
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
            <button
              onClick={onStop}
              disabled={isLoading}
              className={`px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading ? "opacity-60" : ""
              }`}
              aria-label="停止服务"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span className="hidden sm:inline">停止中...</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">停止</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
