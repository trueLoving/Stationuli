// 主应用组件（重构版 - 路由架构）
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DevTools } from "stationuli-common/components";
import "./App.css";
import { MainLayout } from "./layouts/MainLayout";
import { DevicesPage } from "./pages/DevicesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 主布局路由 - 包含顶部栏和底部导航栏 */}
        <Route element={<MainLayout />}>
          {/* 默认重定向到首页 */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          {/* 首页 */}
          <Route path="/home" element={<HomePage />} />
          {/* 设备页面 */}
          <Route path="/devices" element={<DevicesPage />} />
          {/* 历史页面 */}
          <Route path="/history" element={<HistoryPage />} />
          {/* 设置页面 */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      {/* 全局工具（在所有路由外，确保始终可用） */}
      <DevTools variant="mobile" />
    </BrowserRouter>
  );
}

export default App;
