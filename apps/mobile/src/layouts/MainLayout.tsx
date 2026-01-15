// 主布局组件 - 包含顶部栏和底部导航栏
import { Outlet } from "react-router-dom";
import { DEFAULT_PORT } from "../constants";
import { useDiscoverySync } from "../hooks/useDiscoverySync";
import { useDiscoveryStore } from "../stores/discoveryStore";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

export function MainLayout() {
  // 同步设备发现状态（定期刷新设备列表，更新设备信息）
  useDiscoverySync();

  // 从 store 获取数据
  const { isDiscovering, localIp, isLoading, startDiscovery, stopDiscovery } =
    useDiscoveryStore();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* 顶部标题栏 */}
      <MobileHeader
        isDiscovering={isDiscovering}
        localIp={localIp}
        defaultPort={DEFAULT_PORT}
        onStart={startDiscovery}
        onStop={stopDiscovery}
        isLoading={isLoading}
      />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-safe-content">
        <div className="px-4 py-4 space-y-4">
          {/* 页面内容 - 使用 Outlet 渲染子路由 */}
          <Outlet />
        </div>
      </main>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  );
}
