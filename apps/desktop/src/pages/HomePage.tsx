// 首页组件（不包含设备相关操作）
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { ReceivedFilesCard } from "stationuli-common/components";
import type { ReceivedFile } from "stationuli-common/types";
import { fileApiAdapter } from "../api/fileAdapter";
import { FileDetailsDialog } from "../components/FileDetailsDialog";
import { useDiscoveryStore } from "../stores/discoveryStore";
import { useFileTransferStore } from "../stores/fileTransferStore";

export function HomePage() {
  // 从 store 获取数据
  const { isDiscovering } = useDiscoveryStore();
  const {
    receivedFiles,
    saveReceivedFile,
    removeReceivedFile,
    addReceivedFile,
    setTransferProgress,
  } = useFileTransferStore();

  // 文件详情对话框状态（页面级）
  const [showFileDetailsDialog, setShowFileDetailsDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ReceivedFile | null>(null);

  // 打开文件详情对话框
  const handleOpenFileDetails = (file: ReceivedFile) => {
    setSelectedFile(file);
    setShowFileDetailsDialog(true);
  };

  // 关闭文件详情对话框
  const handleCloseFileDetails = () => {
    setShowFileDetailsDialog(false);
    setSelectedFile(null);
  };

  // 监听文件传输相关事件
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
      const data = event.payload as {
        file_name: string;
        file_path: string;
      };

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
    <div className="space-y-4">
      {/* 接收文件卡片（仅在服务启动时显示） */}
      {isDiscovering ? (
        <ReceivedFilesCard
          receivedFiles={receivedFiles}
          onSave={saveReceivedFile}
          onDelete={removeReceivedFile}
          onShowDetails={handleOpenFileDetails}
          variant="desktop"
        />
      ) : (
        /* 服务未启动时的提示 */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-base mb-2">
              启动服务以开始使用文件传输功能
            </p>
            <p className="text-sm text-gray-400">
              请在顶部点击{" "}
              <span className="text-blue-600 font-medium">启动服务</span> 按钮
            </p>
          </div>
        </div>
      )}

      {/* 文件详情对话框 */}
      <FileDetailsDialog
        isOpen={showFileDetailsDialog}
        file={selectedFile}
        onClose={handleCloseFileDetails}
      />
    </div>
  );
}
