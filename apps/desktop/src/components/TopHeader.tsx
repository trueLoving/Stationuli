// 顶部标题栏组件
import { Copy, Play, Square } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { Spinner } from "stationuli-common/components";

const pageTitles: Record<string, string> = {
  home: "首页",
  devices: "设备",
  history: "历史",
  settings: "设置",
};

interface TopHeaderProps {
  isDiscovering: boolean;
  localIp: string;
  defaultPort: number;
  onStart: () => void;
  onStop: () => void;
  isLoading?: boolean;
}

export function TopHeader({
  isDiscovering,
  localIp,
  defaultPort,
  onStart,
  onStop,
  isLoading = false,
}: TopHeaderProps) {
  const currentPage = useAppStore((state) => state.currentPage);
  const [copiedIp, setCopiedIp] = useState(false);

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
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* 左侧：页面标题 */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-gray-800">
          {pageTitles[currentPage] || "首页"}
        </span>
      </div>

      {/* 右侧：启动按钮或 IP 地址 + 停止按钮 */}
      <div className="flex items-center gap-4">
        {!isDiscovering ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
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
        ) : (
          <>
            {localIp && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-mono text-blue-700">
                  {localIp}:{defaultPort}
                </span>
                <button
                  onClick={handleCopyIp}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                  title={copiedIp ? "已复制" : "复制IP地址"}
                  aria-label="复制IP地址"
                >
                  {copiedIp ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✓
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
            <button
              onClick={onStop}
              disabled={isLoading}
              className={`px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 ${
                isLoading ? "opacity-60 cursor-not-allowed" : ""
              }`}
              aria-label="停止服务"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>停止中...</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>停止服务</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
