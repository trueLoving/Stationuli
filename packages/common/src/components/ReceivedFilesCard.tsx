// 接收的文件卡片组件（支持移动端和桌面端样式）

import type { ReceivedFile } from "../types";
import { FileCard } from "./FileCard";

interface ReceivedFilesCardProps {
  receivedFiles: ReceivedFile[];
  onSave: (file: ReceivedFile) => void;
  onOpenLocation?: (file: ReceivedFile) => void;
  variant?: "mobile" | "desktop";
}

export function ReceivedFilesCard({
  receivedFiles,
  onSave,
  onOpenLocation,
  variant = "mobile",
}: ReceivedFilesCardProps) {
  const isMobile = variant === "mobile";
  const padding = isMobile ? "p-5" : "p-6";
  const margin = isMobile ? "" : "mb-6";
  const shadow = isMobile ? "shadow-lg" : "shadow-xl";
  const titleSize = isMobile ? "text-xl" : "text-2xl";
  const titleIconSize = isMobile ? "text-xl" : "text-2xl";
  const emptyPadding = isMobile ? "py-8" : "py-12";
  const emptyIconSize = isMobile ? "text-5xl mb-3" : "text-6xl mb-4";
  const emptyTextSize = isMobile ? "text-base" : "text-lg";
  const badgeMargin = isMobile ? "ml-1" : "ml-2";
  const badgePadding = isMobile ? "px-2.5 py-0.5" : "px-3 py-1";
  const badgeTextSize = isMobile ? "text-xs" : "text-sm";

  return (
    <div
      className={`bg-white rounded-2xl ${shadow} ${padding} ${margin} border border-gray-100`}
    >
      <h2
        className={`${titleSize} font-bold text-gray-800 ${isMobile ? "mb-5" : "mb-6"} flex items-center gap-2`}
      >
        <span className={titleIconSize}>📥</span>
        接收的文件
        {receivedFiles.length > 0 && (
          <span
            className={`${badgeMargin} ${badgePadding} bg-green-100 text-green-700 rounded-full ${badgeTextSize} font-medium`}
          >
            {receivedFiles.length}
          </span>
        )}
      </h2>
      {receivedFiles.length === 0 ? (
        <div className={`text-center ${emptyPadding}`}>
          <div className={emptyIconSize}>📭</div>
          <p className={`text-gray-500 ${emptyTextSize}`}>暂无接收的文件</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receivedFiles.map((file, index) => (
            <FileCard
              key={index}
              file={file}
              onSave={onSave}
              onOpenLocation={onOpenLocation}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
