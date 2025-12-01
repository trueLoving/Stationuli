// 文件选择卡片组件（支持移动端和桌面端样式）

import { formatFileSize } from "../utils";

interface FileSelectionCardProps {
  selectedFile: string;
  selectedFileName: string;
  selectedFileSize: number;
  transferProgress: number;
  onSelectFile: () => void;
  onClearFile: () => void;
  variant?: "mobile" | "desktop";
}

export function FileSelectionCard({
  selectedFile,
  selectedFileName,
  selectedFileSize,
  transferProgress,
  onSelectFile,
  onClearFile,
  variant = "mobile",
}: FileSelectionCardProps) {
  const isMobile = variant === "mobile";
  const padding = isMobile ? "p-5" : "p-6";
  const margin = isMobile ? "mb-4" : "mb-6";
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

  return (
    <div
      className={`bg-white rounded-2xl ${shadow} ${padding} ${margin} border border-gray-100`}
    >
      <h2
        className={`${titleSize} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-6"} flex items-center gap-2`}
      >
        <span className={titleIconSize}>📁</span>
        文件选择
      </h2>
      <div className={isMobile ? "mb-5" : "mb-6"}>
        <button onClick={onSelectFile} className={buttonClass}>
          <span>📂</span>
          选择文件
        </button>
        {selectedFile && (
          <div
            className={`mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 ${isMobile ? "mb-2 flex items-center gap-1" : "mb-1"}`}
                >
                  {isMobile && <span>📄</span>}
                  已选择文件
                </p>
                <p
                  className={`font-${isMobile ? "semibold" : "mono"} ${isMobile ? "text-sm" : "text-sm"} font-${isMobile ? "semibold" : "semibold"} text-gray-800 break-all ${isMobile ? "mb-1" : ""}`}
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
                className={`px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium ${isMobile ? "active:scale-95 transition-all" : "hover:bg-red-200 transition-colors"}`}
                title="清除选择"
              >
                ✕
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
