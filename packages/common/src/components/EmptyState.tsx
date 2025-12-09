// 空状态组件（支持移动端和桌面端样式）

import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "mobile" | "desktop";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "mobile",
}: EmptyStateProps) {
  const isMobile = variant === "mobile";

  // 尺寸配置
  const iconSize = isMobile ? "w-20 h-20" : "w-16 h-16";
  const iconContainerSize = isMobile ? "w-20 h-20" : "w-16 h-16";
  const titleSize = isMobile ? "text-base" : "text-lg";
  const descriptionSize = isMobile ? "text-sm" : "text-sm";
  const padding = isMobile ? "py-8" : "py-12";
  const iconMargin = isMobile ? "mb-3" : "mb-4";
  const titleMargin = isMobile ? "mb-1" : "mb-2";
  const descriptionMargin = isMobile ? "mb-4" : "mb-6";
  const buttonClass = isMobile
    ? "w-full px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2";

  // 渲染图标
  const renderIcon = () => {
    if (!Icon) return null;

    if (typeof Icon === "string") {
      // Emoji 图标
      return (
        <div
          className={`${iconContainerSize} flex items-center justify-center ${iconMargin} mx-auto`}
        >
          <span className={`${isMobile ? "text-6xl" : "text-5xl"}`}>
            {Icon}
          </span>
        </div>
      );
    } else {
      // Lucide 图标组件
      const IconComponent = Icon;
      return (
        <div className={`flex justify-center ${iconMargin}`}>
          <div
            className={`${iconContainerSize} bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center`}
          >
            <IconComponent
              className={`${iconSize} text-gray-400`}
              aria-hidden="true"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`text-center ${padding}`}>
      {renderIcon()}
      <h3 className={`${titleSize} font-semibold text-gray-800 ${titleMargin}`}>
        {title}
      </h3>
      {description && (
        <p
          className={`${descriptionSize} text-gray-500 ${action ? descriptionMargin : ""}`}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={buttonClass}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
