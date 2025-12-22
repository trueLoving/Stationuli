// 主布局组件
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface LayoutProps {
  children: ReactNode;
  // 服务状态相关 props
  isDiscovering: boolean;
  localIp: string;
  defaultPort: number;
  onStartDiscovery: () => void;
  onStopDiscovery: () => void;
  isLoading?: boolean;
}

export function Layout({
  children,
  isDiscovering,
  localIp,
  defaultPort,
  onStartDiscovery,
  onStopDiscovery,
  isLoading = false,
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 左侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部标题栏 */}
        <TopHeader
          isDiscovering={isDiscovering}
          localIp={localIp}
          defaultPort={defaultPort}
          onStart={onStartDiscovery}
          onStop={onStopDiscovery}
          isLoading={isLoading}
        />

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
