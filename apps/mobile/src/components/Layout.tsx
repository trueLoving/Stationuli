// 移动端主布局组件
import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* 顶部标题栏 */}
      <MobileHeader
        isDiscovering={isDiscovering}
        localIp={localIp}
        defaultPort={defaultPort}
        onStart={onStartDiscovery}
        onStop={onStopDiscovery}
        isLoading={isLoading}
      />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-safe-content">
        <div className="px-4 py-4 space-y-4">{children}</div>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  );
}
