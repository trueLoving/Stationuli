// 主布局组件 - 包含侧边栏和顶部栏
import { Outlet } from "react-router-dom";
import { DEFAULT_PORT } from "../constants";
import { useDiscoveryStore } from "../stores/discoveryStore";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function MainLayout() {
  // 从 store 获取数据
  const { isDiscovering, localIp, isLoading, startDiscovery, stopDiscovery } =
    useDiscoveryStore();
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
          defaultPort={DEFAULT_PORT}
          onStart={startDiscovery}
          onStop={stopDiscovery}
          isLoading={isLoading}
        />

        {/* 页面内容 - 使用 Outlet 渲染子路由 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
