// 底部导航栏组件
import { Home, History, Settings, Smartphone } from "lucide-react";
import { useAppStore } from "../stores/appStore";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  page: "home" | "devices" | "history" | "settings";
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "首页",
    icon: <Home className="w-5 h-5" />,
    page: "home",
  },
  {
    id: "devices",
    label: "设备",
    icon: <Smartphone className="w-5 h-5" />,
    page: "devices",
  },
  {
    id: "history",
    label: "历史",
    icon: <History className="w-5 h-5" />,
    page: "history",
  },
  {
    id: "settings",
    label: "设置",
    icon: <Settings className="w-5 h-5" />,
    page: "settings",
  },
];

export function BottomNav() {
  const currentPage = useAppStore((state) => state.currentPage);
  const setCurrentPage = useAppStore((state) => state.setCurrentPage);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 bottom-nav-safe z-50">
      <div className="flex items-center justify-around h-16 px-2 pb-safe-bottom">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          const isDisabled =
            item.page === "history" || item.page === "settings";
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setCurrentPage(item.page)}
              disabled={isDisabled}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-blue-600"
                  : isDisabled
                    ? "text-gray-400 cursor-not-allowed opacity-50"
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
