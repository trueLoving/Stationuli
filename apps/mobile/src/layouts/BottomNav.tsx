// 底部导航栏组件
import { History, Home, Settings, Smartphone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 bottom-nav-safe z-50">
      <div className="flex items-center justify-around h-16 px-2 pb-safe-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isDisabled =
            item.path === "/history" || item.path === "/settings";
          return (
            <Link
              key={item.id}
              to={isDisabled ? "#" : item.path}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-blue-600"
                  : isDisabled
                    ? "text-gray-400 cursor-not-allowed opacity-50 pointer-events-none"
                    : "text-gray-500 active:text-gray-700"
              }`}
              aria-label={item.label}
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
              <span
                className={`text-xs mt-0.5 font-medium ${
                  isActive
                    ? "text-blue-600"
                    : isDisabled
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
