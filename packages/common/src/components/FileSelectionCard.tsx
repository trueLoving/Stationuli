// 文件选择卡片组件（支持移动端和桌面端样式）

import { File, Folder, FolderOpen, X } from "lucide-react";
import { useRef, useState } from "react";
import { formatFileSize } from "../utils";

interface FileSelectionCardProps {
  selectedFile: string;
  selectedFileName: string;
  selectedFileSize: number;
  transferProgress: number;
  onSelectFile: () => void;
  onClearFile: () => void;
  onFileDrop?: (file: File) => void;
  variant?: "mobile" | "desktop";
}

export function FileSelectionCard({
  selectedFile,
  selectedFileName,
  selectedFileSize,
  transferProgress,
  onSelectFile,
  onClearFile,
  onFileDrop,
  variant = "mobile",
}: FileSelectionCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = variant === "mobile";
  const padding = isMobile ? "p-5" : "p-6";
  const margin = isMobile ? "mb-5" : "mb-6";
  const shadow = isMobile ? "shadow-lg" : "shadow-xl";
  const titleSize = isMobile ? "text-xl" : "text-2xl";
  const titleIconSize = isMobile ? "text-xl" : "text-2xl";
  const buttonClass = isMobile
    ? "w-full px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2";
  const progressMargin = isMobile ? "mt-5" : "mt-6";
  const progressPadding = isMobile ? "p-4" : "p-5";
  const progressBarHeight = isMobile ? "h-3" : "h-4";
  const progressTextSize = isMobile ? "text-xs" : "text-sm";
  const progressThreshold = isMobile ? 15 : 10;

  const handleDragOver = (e: React.DragEvent) => {
    if (!isMobile && onFileDrop) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isMobile && onFileDrop) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isMobile && onFileDrop) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFileDrop(files[0]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectFile();
    }
    if (selectedFile && (e.key === "Delete" || e.key === "Backspace")) {
      if (
        e.target === e.currentTarget ||
        (e.target as HTMLElement).tagName !== "INPUT"
      ) {
        e.preventDefault();
        onClearFile();
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl ${shadow} ${padding} ${margin} border border-gray-100`}
    >
      <h2
        className={`${titleSize} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-6"} flex items-center gap-2`}
      >
        <Folder
          className={isMobile ? "w-5 h-5" : "w-6 h-6"}
          aria-hidden="true"
        />
        文件选择
      </h2>
      <div
        className={isMobile ? "mb-5" : "mb-6"}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!isMobile && onFileDrop && (
          <div
            className={`mb-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? "border-purple-500 bg-purple-50"
                : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/50"
            }`}
          >
            <FolderOpen
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              aria-hidden="true"
            />
            <p className="text-gray-600 mb-2 font-medium">
              拖拽文件到此处或点击下方按钮选择
            </p>
            <p className="text-sm text-gray-400">支持单个文件</p>
          </div>
        )}
        <button
          onClick={onSelectFile}
          onKeyDown={handleKeyDown}
          className={buttonClass}
          aria-label="选择文件"
          tabIndex={0}
        >
          <FolderOpen
            className={isMobile ? "w-5 h-5" : "w-4 h-4"}
            aria-hidden="true"
          />
          <span>选择文件</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileDrop) {
              onFileDrop(file);
            }
          }}
          aria-hidden="true"
        />
        {selectedFile && (
          <div
            className={`mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 ${isMobile ? "mb-2 flex items-center gap-1" : "mb-1"} flex items-center gap-1`}
                >
                  <File
                    className={isMobile ? "w-3 h-3" : "w-4 h-4"}
                    aria-hidden="true"
                  />
                  已选择文件
                </p>
                <p
                  className={`font-${isMobile ? "semibold" : "mono"} ${isMobile ? "text-sm" : "text-sm"} font-${isMobile ? "semibold" : "semibold"} text-gray-800 truncate ${isMobile ? "mb-1" : ""}`}
                  title={
                    selectedFileName ||
                    selectedFile.split("/").pop() ||
                    selectedFile
                  }
                >
                  {selectedFileName ||
                    selectedFile.split("/").pop() ||
                    selectedFile}
                </p>
                {selectedFileSize > 0 && (
                  <p
                    className={`text-xs text-gray-500 ${isMobile ? "" : "mt-1"}`}
                  >
                    {formatFileSize(selectedFileSize)}
                  </p>
                )}
              </div>
              <button
                onClick={onClearFile}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClearFile();
                  }
                }}
                className={`px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium ${isMobile ? "active:scale-95 transition-all" : "hover:bg-red-200 transition-colors"} flex items-center justify-center`}
                title="清除选择 (Delete/Backspace)"
                aria-label="清除选择"
                tabIndex={0}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {transferProgress > 0 && transferProgress < 100 && (
        <div
          className={`${progressMargin} ${progressPadding} bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`${progressTextSize} font-medium text-gray-700`}>
              传输进度
            </span>
            <span className={`${progressTextSize} font-bold text-green-600`}>
              {transferProgress}%
            </span>
          </div>
          <div
            className={`w-full ${progressBarHeight} bg-gray-200 rounded-full overflow-hidden shadow-inner`}
          >
            <div
              className={`h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300 ease-out flex items-center justify-end ${isMobile ? "pr-1.5" : "pr-2"}`}
              style={{ width: `${transferProgress}%` }}
            >
              {transferProgress > progressThreshold && (
                <span
                  className={`${isMobile ? "text-[10px]" : "text-xs"} text-white font-medium`}
                >
                  {transferProgress}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
