// 文件卡片组件（支持移动端和桌面端样式）

import type { ReceivedFile } from "../types";

interface FileCardProps {
  file: ReceivedFile;
  onSave: (file: ReceivedFile) => void;
  onOpenLocation?: (file: ReceivedFile) => void;
  variant?: "mobile" | "desktop";
}

export function FileCard({
  file,
  onSave,
  onOpenLocation,
  variant = "mobile",
}: FileCardProps) {
  const isMobile = variant === "mobile";
  const iconSize = isMobile ? "w-10 h-10 text-xl" : "w-12 h-12 text-2xl";
  const titleSize = isMobile ? "text-sm" : "";
  const pathSize = isMobile ? "text-xs" : "text-sm";
  const buttonClass = isMobile
    ? "w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-sm"
    : "flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2";
  const containerClass = isMobile
    ? "p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 active:scale-98 transition-all duration-150"
    : "p-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200";

  return (
    <div className={containerClass}>
      <div
        className={`flex items-center ${isMobile ? "gap-3 mb-3" : "gap-4 mb-3"}`}
      >
        <div
          className={`${iconSize} bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm ${isMobile ? "flex-shrink-0" : ""}`}
        >
          📄
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-gray-800 ${titleSize} mb-1 truncate`}
          >
            {file.name}
          </div>
          <div className={`${pathSize} text-gray-600 truncate`}>
            {file.path}
          </div>
        </div>
      </div>
      <div className={isMobile ? "" : "flex gap-3"}>
        <button onClick={() => onSave(file)} className={buttonClass}>
          <span>💾</span>
          保存到指定目录
        </button>
        {onOpenLocation && !isMobile && (
          <button
            onClick={() => onOpenLocation(file)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>📂</span>
            打开位置
          </button>
        )}
      </div>
    </div>
  );
}
