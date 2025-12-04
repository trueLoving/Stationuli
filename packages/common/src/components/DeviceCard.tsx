// 设备卡片组件

import { Globe, Laptop, Link2, Smartphone, Upload } from "lucide-react";
import type { DeviceInfo } from "../types";

interface DeviceCardProps {
  device: DeviceInfo;
  onTestConnection: (device: DeviceInfo) => void;
  onSendFile: (device: DeviceInfo) => void;
  showActions?: boolean;
  variant?: "mobile" | "desktop";
}

export function DeviceCard({
  device,
  onTestConnection,
  onSendFile,
  showActions = true,
  variant = "mobile",
}: DeviceCardProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={`${
        isMobile
          ? "p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 active:scale-98 transition-all duration-150"
          : "flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
      }`}
    >
      <div
        className={`flex items-center ${isMobile ? "gap-3 mb-3" : "gap-4 flex-1"}`}
      >
        <div
          className={`${
            isMobile
              ? "w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
              : "w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm"
          }`}
        >
          {device.device_type === "mobile" ? (
            <Smartphone
              className={isMobile ? "w-5 h-5 text-white" : "w-6 h-6 text-white"}
              aria-hidden="true"
            />
          ) : (
            <Laptop
              className={isMobile ? "w-5 h-5 text-white" : "w-6 h-6 text-white"}
              aria-hidden="true"
            />
          )}
        </div>
        <div className={isMobile ? "flex-1 min-w-0" : "flex-1"}>
          <div
            className={`font-semibold text-gray-800 ${isMobile ? "text-sm mb-1 truncate" : "mb-1 truncate"}`}
            title={device.name}
          >
            {device.name}
          </div>
          <div
            className={`flex items-center gap-2 ${isMobile ? "flex-wrap" : "text-sm text-gray-600"}`}
          >
            <span
              className={`${isMobile ? "text-xs text-gray-600 flex items-center gap-1" : "flex items-center gap-1"}`}
            >
              <Globe
                className={isMobile ? "w-3 h-3" : "w-4 h-4"}
                aria-hidden="true"
              />
              <span className="truncate max-w-[120px] sm:max-w-none">
                {device.address}:{device.port}
              </span>
            </span>
            <span
              className={`px-2 py-0.5 bg-gray-200 rounded ${isMobile ? "text-xs" : "text-xs"}`}
            >
              {device.device_type}
            </span>
          </div>
        </div>
      </div>
      {showActions && (
        <div className={isMobile ? "flex gap-2 w-full" : "ml-4 flex gap-2"}>
          <button
            onClick={() => onTestConnection(device)}
            className={`${
              isMobile
                ? "flex-1 px-3 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-1 text-xs"
                : "px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            }`}
            title="测试连接"
            aria-label="测试连接"
          >
            <Link2
              className={isMobile ? "w-3 h-3" : "w-4 h-4"}
              aria-hidden="true"
            />
            {isMobile ? "测试" : "测试连接"}
          </button>
          <button
            onClick={() => onSendFile(device)}
            className={`${
              isMobile
                ? "flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-sm"
                : "px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            }`}
            aria-label="发送文件"
          >
            <Upload
              className={isMobile ? "w-4 h-4" : "w-5 h-5"}
              aria-hidden="true"
            />
            <span>发送文件</span>
          </button>
        </div>
      )}
    </div>
  );
}
