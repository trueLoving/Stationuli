// 底部导航栏组件

import { Settings, Upload } from "lucide-react";
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 bottom-nav-safe w-full">
      <div className="flex items-center justify-around h-16 px-2 w-full">
        <button
          onClick={() => onTabChange("transfer")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
            activeTab === "transfer" ? "text-blue-600" : "text-gray-500"
          }`}
          aria-label="文件传输"
          aria-current={activeTab === "transfer" ? "page" : undefined}
        >
          <Upload className="w-6 h-6 mb-1" aria-hidden="true" />
          <span className="text-xs font-medium">文件传输</span>
          {activeTab === "transfer" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => onTabChange("control")}
          disabled
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative cursor-not-allowed opacity-60 text-gray-400"
          title="开发中"
          aria-label="设备控制（开发中）"
        >
          <Settings className="w-6 h-6 mb-1" aria-hidden="true" />
          <span className="text-xs font-medium flex items-center gap-1">
            设备控制
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
              开发中
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
