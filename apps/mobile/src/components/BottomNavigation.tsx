// 底部导航栏组件

import type { TabType } from "../types";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => onTabChange("transfer")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
            activeTab === "transfer" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <span className="text-2xl mb-1">📤</span>
          <span className="text-xs font-medium">文件传输</span>
          {activeTab === "transfer" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => onTabChange("control")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
            activeTab === "control" ? "text-purple-600" : "text-gray-500"
          }`}
        >
          <span className="text-2xl mb-1">⚙️</span>
          <span className="text-xs font-medium">设备控制</span>
          {activeTab === "control" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full"></div>
          )}
        </button>
      </div>
    </div>
  );
}
