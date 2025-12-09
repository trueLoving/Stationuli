// 欢迎界面空状态组件（只显示启动服务按钮）

import { Check, Copy, Play, Smartphone } from "lucide-react";
import { useState } from "react";
import { Spinner } from "./Spinner";

interface WelcomeEmptyStateProps {
  onStartService?: () => void;
  onStopService?: () => void;
  isDiscovering?: boolean;
  deviceId?: string;
  localIp?: string;
  defaultPort?: number;
  isLoading?: boolean;
  variant?: "mobile" | "desktop";
}

export function WelcomeEmptyState({
  onStartService,
  onStopService,
  isDiscovering = false,
  deviceId = "",
  localIp = "",
  defaultPort = 8080,
  isLoading = false,
  variant = "mobile",
}: WelcomeEmptyStateProps) {
  const isMobile = variant === "mobile";
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // 尺寸配置
  const iconSize = isMobile ? "w-16 h-16" : "w-20 h-20";
  const iconContainerSize = isMobile ? "w-24 h-24" : "w-28 h-28";
  const welcomeTitleSize = isMobile ? "text-2xl" : "text-3xl";
  const descriptionSize = isMobile ? "text-sm" : "text-base";
  const buttonClass = isMobile
    ? "w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-base";

  const stopButtonClass = isMobile
    ? "w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-base";

  return (
    <div className="text-center">
      {/* 顶部图标和欢迎文字 */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div
            className={`${iconContainerSize} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Smartphone
              className={`${iconSize} text-blue-600`}
              aria-hidden="true"
            />
          </div>
        </div>
        <h2 className={`${welcomeTitleSize} font-bold text-gray-800 mb-3`}>
          欢迎使用 Stationuli
        </h2>
        <p className={`${descriptionSize} text-gray-600 max-w-md mx-auto`}>
          启动服务以开始使用文件传输和设备连接功能
        </p>
      </div>

      {/* 启动服务按钮 */}
      {onStartService && !isDiscovering && (
        <div className={`mb-6 ${isMobile ? "" : "flex justify-center"}`}>
          <button
            onClick={onStartService}
            disabled={isLoading}
            className={`${buttonClass} ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
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
                <Play className="w-5 h-5" aria-hidden="true" />
                <span>启动服务</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 服务已启动时显示本设备信息（仅作为过渡信息，因为会立即切换到主页） */}
      {isDiscovering && (localIp || deviceId) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <p className={`${descriptionSize} text-gray-600 mb-2 font-medium`}>
            本设备信息
          </p>
          {localIp && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <p
                className={`font-mono ${descriptionSize} font-semibold text-gray-800`}
              >
                IP: {localIp}:{defaultPort}
              </p>
              <button
                onClick={async () => {
                  const textToCopy = `${localIp}:${defaultPort}`;
                  try {
                    await navigator.clipboard.writeText(textToCopy);
                    setCopiedIp(true);
                    setTimeout(() => setCopiedIp(false), 1000);
                  } catch (err) {
                    console.error("复制失败:", err);
                  }
                }}
                className="px-2 py-1 text-gray-500 hover:text-gray-700 active:text-green-600 transition-colors"
                title="复制IP地址"
                aria-label="复制IP地址"
              >
                {copiedIp ? (
                  <Check
                    className="w-4 h-4 text-green-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
          {deviceId && (
            <div className="flex items-center justify-center gap-2">
              <p className={`font-mono ${descriptionSize} text-gray-600`}>
                ID: {deviceId}
              </p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(deviceId);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 1000);
                  } catch (err) {
                    console.error("复制失败:", err);
                  }
                }}
                className="px-2 py-1 text-gray-500 hover:text-gray-700 active:text-green-600 transition-colors"
                title="复制设备ID"
                aria-label="复制设备ID"
              >
                {copiedId ? (
                  <Check
                    className="w-4 h-4 text-green-600"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
