// 文件卡片组件（支持移动端和桌面端样式）

import { File, FolderOpen, Save } from "lucide-react";
import type { ReceivedFile } from "../types";

// 根据文件扩展名获取文件类型图标
function getFileIcon(_fileName: string) {
  return <File className="w-5 h-5 text-white" aria-hidden="true" />;
}

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
          className={`${isMobile ? "w-10 h-10" : "w-12 h-12"} bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm ${isMobile ? "flex-shrink-0" : ""}`}
        >
          {getFileIcon(file.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-gray-800 ${titleSize} mb-1 truncate`}
            title={file.name}
          >
            {file.name}
          </div>
          <div
            className={`${pathSize} text-gray-600 truncate`}
            title={file.path}
          >
            {file.path}
          </div>
        </div>
      </div>
      <div className={isMobile ? "" : "flex gap-3"}>
        <button
          onClick={() => onSave(file)}
          className={buttonClass}
          aria-label="保存文件"
        >
          <Save
            className={isMobile ? "w-4 h-4" : "w-5 h-5"}
            aria-hidden="true"
          />
          <span>保存到指定目录</span>
        </button>
        {onOpenLocation && !isMobile && (
          <button
            onClick={() => onOpenLocation(file)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            aria-label="打开文件位置"
          >
            <FolderOpen className="w-5 h-5" aria-hidden="true" />
            <span>打开位置</span>
          </button>
        )}
      </div>
    </div>
  );
}
