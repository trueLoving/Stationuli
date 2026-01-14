// 主应用组件（重构版 - 设备中心架构）
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DevTools } from "stationuli-common/components";
import { fileApiAdapter } from "./api/fileAdapter";
import "./App.css";
import { FileDetailsDialog } from "./components/FileDetailsDialog";
import { Workspace } from "./components/Workspace";
import { useDiscoverySync } from "./hooks/useDiscoverySync";
import { MainLayout } from "./layouts/MainLayout";
import { DevicesPage } from "./pages/DevicesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import { useFileTransferStore } from "./stores/fileTransferStore";
import { useUiStore } from "./stores/uiStore";

function App() {
  // 使用全局 store
  const { addReceivedFile, setTransferProgress } = useFileTransferStore();
  const {
    workspaceDevice,
    setWorkspaceDevice,
    showFileDetailsDialog,
    selectedFile,
    closeFileDetailsDialog,
  } = useUiStore();

  // 同步设备发现状态
  useDiscoverySync();

  // 监听传输进度事件
  useEffect(() => {
    const progressUnlisten = listen("transfer-progress", (event) => {
      const data = event.payload as { progress: number };
      setTransferProgress(data.progress);
    });

    const completeUnlisten = listen("transfer-complete", (event) => {
      const data = event.payload as { file: string };
      setTransferProgress(100);
      const fileName = data.file.split("/").pop() || data.file;
      alert(`✅ 文件发送成功！\n文件名: ${fileName}\n路径: ${data.file}`);
      setTimeout(() => {
        setTransferProgress(0);
      }, 2000);
    });

    const receivedUnlisten = listen("file-received", async (event) => {
      const data = event.payload as { file_name: string; file_path: string };

      // 获取文件大小
      let fileSize: number | undefined;
      try {
        fileSize = await fileApiAdapter.getFileSize(data.file_path);
      } catch (error) {
        console.warn("Failed to get file size:", error);
      }

      addReceivedFile({
        name: data.file_name,
        path: data.file_path,
        size: fileSize,
        receivedAt: Date.now(),
        sender: undefined, // 未来可以从事件中获取发送方信息
      });
      alert(`文件 "${data.file_name}" 接收成功！`);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
      completeUnlisten.then((unlisten) => unlisten());
      receivedUnlisten.then((unlisten) => unlisten());
    };
  }, [addReceivedFile, setTransferProgress]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 主布局路由 - 包含侧边栏和顶部栏 */}
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

      {/* 全局对话框和工具（在所有路由外，确保始终可用） */}
      {/* 工作台（模态窗口） */}
      {workspaceDevice && (
        <Workspace
          device={workspaceDevice}
          onClose={() => setWorkspaceDevice(null)}
        />
      )}

      {/* 文件详情对话框 */}
      <FileDetailsDialog
        isOpen={showFileDetailsDialog}
        file={selectedFile}
        onClose={closeFileDetailsDialog}
      />

      {/* 开发工具 */}
      <DevTools variant="desktop" />
    </BrowserRouter>
  );
}

export default App;
