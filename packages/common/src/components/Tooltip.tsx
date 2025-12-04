// Tooltip 组件

import { useEffect, useRef, useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "right",
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    timeoutId.current = id;
  };

  const handleMouseLeave = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setIsVisible(false);
  };

  // 计算 Tooltip 位置（使用 fixed 定位以脱离父容器）
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = 32; // 估算高度
      const tooltipWidth = 120; // 估算宽度
      const offset = 8; // 间距
      const arrowSize = 8; // 箭头大小

      let top = 0;
      let left = 0;
      let transform = "";

      switch (position) {
        case "top":
          top = triggerRect.top - tooltipHeight - offset - arrowSize;
          left = triggerRect.left + triggerRect.width / 2;
          transform = "translateX(-50%)";
          break;
        case "bottom":
          top = triggerRect.bottom + offset + arrowSize;
          left = triggerRect.left + triggerRect.width / 2;
          transform = "translateX(-50%)";
          break;
        case "left":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.left - tooltipWidth - offset - arrowSize;
          transform = "translateY(-50%)";
          break;
        case "right":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.right + offset + arrowSize;
          transform = "translateY(-50%)";
          break;
      }

      setTooltipStyle({
        top: `${top}px`,
        left: `${left}px`,
        transform,
      });
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="fixed z-[9999] px-3 py-1.5 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
          style={tooltipStyle}
          role="tooltip"
        >
          {content}
          {/* 箭头 */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${
              position === "top"
                ? "top-full left-1/2 -translate-x-1/2 border-t-gray-800"
                : position === "bottom"
                  ? "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800"
                  : position === "left"
                    ? "left-full top-1/2 -translate-y-1/2 border-l-gray-800"
                    : "right-full top-1/2 -translate-y-1/2 border-r-gray-800"
            }`}
          ></div>
        </div>
      )}
    </>
  );
}
