// 左侧边栏导航组件
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  Settings,
  Smartphone,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "../stores/appStore";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "首页",
    icon: <Home className="w-5 h-5" />,
    path: "/home",
  },
  {
    id: "devices",
    label: "设备",
    icon: <Smartphone className="w-5 h-5" />,
    path: "/devices",
  },
  {
    id: "history",
    label: "历史",
    icon: <History className="w-5 h-5" />,
    path: "/history",
  },
  {
    id: "settings",
    label: "设置",
    icon: <Settings className="w-5 h-5" />,
    path: "/settings",
  },
];

export function Sidebar() {
  const location = useLocation();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo 区域 */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">
                Stationuli
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="折叠侧边栏"
              aria-label="折叠侧边栏"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="展开侧边栏"
              aria-label="展开侧边栏"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isDisabled =
            item.path === "/history" || item.path === "/settings";
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 py-3 transition-colors ${
                sidebarCollapsed ? "justify-center px-0" : "px-4 text-left"
              } ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : isDisabled
                    ? "text-gray-400 cursor-not-allowed opacity-50 pointer-events-none"
                    : "text-gray-700 hover:bg-gray-50"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span
                className={
                  isActive
                    ? "text-blue-600"
                    : isDisabled
                      ? "text-gray-400"
                      : "text-gray-500"
                }
              >
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 底部：流量统计（可选，未来功能） */}
      {!sidebarCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-2">流量统计</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-green-500" />
                上传
              </span>
              <span>0 B/s</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500 rotate-180" />
                下载
              </span>
              <span>0 B/s</span>
            </div>
            <div className="flex items-center justify-between text-gray-700 font-medium pt-1 border-t border-gray-100">
              <span>总计</span>
              <span>0 B</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
