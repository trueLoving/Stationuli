// 文件详情弹窗组件

import { Calendar, File, Globe, HardDrive, X } from "lucide-react";
import type { ReceivedFile } from "../types";

interface FileDetailsDialogProps {
  isOpen: boolean;
  file: ReceivedFile | null;
  onClose: () => void;
  variant?: "mobile" | "desktop";
}

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "未知";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 格式化完整时间
function formatFullTime(timestamp?: number): string {
  if (!timestamp) return "未知";
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function FileDetailsDialog({
  isOpen,
  file,
  onClose,
  variant = "mobile",
}: FileDetailsDialogProps) {
  if (!isOpen || !file) return null;

  const isMobile = variant === "mobile";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${
          isMobile
            ? "p-5 w-full max-w-sm my-4"
            : "p-8 w-full max-w-lg mx-4 my-4"
        } transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-800 flex items-center gap-3`}
          >
            <div
              className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md`}
            >
              <File
                className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-white`}
                aria-hidden="true"
              />
            </div>
            文件详情
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 文件信息 */}
        <div className={`${isMobile ? "space-y-4" : "space-y-5"}`}>
          {/* 文件名称 */}
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              文件名称
            </label>
            <div
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} bg-gray-50 border border-gray-200 rounded-xl ${isMobile ? "text-sm" : "text-base"} text-gray-800 break-all`}
            >
              {file.name}
            </div>
          </div>

          {/* 文件大小 */}
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"} flex items-center gap-2`}
            >
              <HardDrive className="w-4 h-4" aria-hidden="true" />
              文件大小
            </label>
            <div
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} bg-gray-50 border border-gray-200 rounded-xl ${isMobile ? "text-sm" : "text-base"} text-gray-800`}
            >
              {formatFileSize(file.size)}
            </div>
          </div>

          {/* 接收时间 */}
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"} flex items-center gap-2`}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              接收时间
            </label>
            <div
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} bg-gray-50 border border-gray-200 rounded-xl ${isMobile ? "text-sm" : "text-base"} text-gray-800`}
            >
              {formatFullTime(file.receivedAt)}
            </div>
          </div>

          {/* 发送方 */}
          {file.sender && (
            <div>
              <label
                className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"} flex items-center gap-2`}
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                发送方
              </label>
              <div
                className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} bg-gray-50 border border-gray-200 rounded-xl ${isMobile ? "text-sm" : "text-base"} text-gray-800`}
              >
                {file.sender}
              </div>
            </div>
          )}

          {/* 文件路径 */}
          <div>
            <label
              className={`block ${isMobile ? "text-sm" : "text-sm"} font-medium text-gray-700 ${isMobile ? "mb-2" : "mb-2.5"}`}
            >
              文件路径
            </label>
            <div
              className={`w-full ${isMobile ? "px-4 py-3" : "px-4 py-3"} bg-gray-50 border border-gray-200 rounded-xl ${isMobile ? "text-xs" : "text-sm"} text-gray-600 break-all font-mono`}
            >
              {file.path}
            </div>
          </div>
        </div>

        {/* 关闭按钮 */}
        <div className={`flex justify-end ${isMobile ? "mt-6" : "mt-8"}`}>
          <button
            onClick={onClose}
            className={`${isMobile ? "px-6 py-3" : "px-8 py-3"} bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 ${isMobile ? "active:scale-95" : "hover:shadow-md"}`}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
