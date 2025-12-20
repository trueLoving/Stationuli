// 文件卡片组件（支持移动端和桌面端样式）

import { File, Info, MoreVertical, Save, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ReceivedFile } from "../types";

// 根据文件扩展名获取文件类型图标
function getFileIcon(_fileName: string) {
  return <File className="w-5 h-5 text-white" aria-hidden="true" />;
}

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "未知大小";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 格式化时间
function formatTime(timestamp?: number): string {
  if (!timestamp) return "未知时间";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return "刚刚";
  }
}

interface FileCardProps {
  file: ReceivedFile;
  onSave: (file: ReceivedFile) => void;
  onDelete?: (file: ReceivedFile) => void;
  onShowDetails?: (file: ReceivedFile) => void;
  variant?: "mobile" | "desktop";
}

export function FileCard({
  file,
  onSave,
  onDelete,
  onShowDetails,
  variant = "mobile",
}: FileCardProps) {
  const isMobile = variant === "mobile";
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  return (
    <div
      className={`${
        isMobile
          ? "flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-150"
          : "flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
      }`}
    >
      {/* 文件图标 */}
      <div
        className={`${isMobile ? "w-10 h-10" : "w-12 h-12"} bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}
      >
        {getFileIcon(file.name)}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-semibold text-gray-800 ${isMobile ? "text-sm" : "text-base"} truncate`}
          title={file.name}
        >
          {file.name}
        </div>
        <div
          className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500 truncate`}
        >
          {formatFileSize(file.size)} · {formatTime(file.receivedAt)}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => onSave(file)}
          className={`${
            isMobile
              ? "px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-1 text-xs"
              : "px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          }`}
          aria-label="保存文件"
          title="保存文件"
        >
          <Save
            className={isMobile ? "w-4 h-4" : "w-4 h-4"}
            aria-hidden="true"
          />
          {!isMobile && <span>保存</span>}
        </button>

        {(onDelete || onShowDetails) && (
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`${
                isMobile
                  ? "px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center"
                  : "px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              }`}
              aria-label="更多操作"
              title="更多操作"
            >
              <MoreVertical
                className={isMobile ? "w-4 h-4" : "w-4 h-4"}
                aria-hidden="true"
              />
            </button>
            {showMoreMenu && (
              <div
                className={`absolute ${
                  isMobile ? "right-0 top-full mt-1" : "right-0 top-full mt-2"
                } z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]`}
              >
                {onShowDetails && (
                  <button
                    onClick={() => {
                      onShowDetails(file);
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    aria-label="查看详情"
                  >
                    <Info className="w-4 h-4" aria-hidden="true" />
                    详情
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(file);
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    aria-label="删除记录"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    删除
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
