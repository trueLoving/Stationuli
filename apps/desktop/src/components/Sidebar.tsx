// 侧边栏组件

import type { TabType } from "../types";

interface SidebarProps {
  activeTab: TabType;
  sidebarCollapsed: boolean;
  onTabChange: (tab: TabType) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeTab,
  sidebarCollapsed,
  onTabChange,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <div
      className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* 侧边栏头部 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">📡</span>
            </div>
            <span className="font-bold text-gray-800">Stationuli</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={sidebarCollapsed ? "展开菜单" : "折叠菜单"}
        >
          <span className="text-xl">{sidebarCollapsed ? "▶" : "◀"}</span>
        </button>
      </div>

      {/* 菜单项 */}
      <div className="py-4">
        <button
          onClick={() => onTabChange("transfer")}
          className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
            activeTab === "transfer"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-xl flex-shrink-0">📤</span>
          {!sidebarCollapsed && <span className="font-medium">文件传输</span>}
        </button>
        <button
          onClick={() => onTabChange("control")}
          className={`w-full flex items-center gap-3 px-4 py-3 mx-2 mt-2 rounded-xl transition-all duration-200 ${
            activeTab === "control"
              ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-xl flex-shrink-0">⚙️</span>
          {!sidebarCollapsed && <span className="font-medium">设备控制</span>}
        </button>
      </div>
    </div>
  );
}
