// 首页组件（不包含设备相关操作）
import { ReceivedFilesCard } from "stationuli-common/components";
import { useDiscoveryStore } from "../stores/discoveryStore";
import { useFileTransferStore } from "../stores/fileTransferStore";
import { useUiStore } from "../stores/uiStore";

export function HomePage() {
  // 从 store 获取数据
  const { isDiscovering } = useDiscoveryStore();
  const { receivedFiles, saveReceivedFile, removeReceivedFile } =
    useFileTransferStore();
  const { openFileDetailsDialog } = useUiStore();
  return (
    <div className="space-y-4">
      {/* 接收文件卡片（仅在服务启动时显示） */}
      {isDiscovering ? (
        <ReceivedFilesCard
          receivedFiles={receivedFiles}
          onSave={saveReceivedFile}
          onDelete={removeReceivedFile}
          onShowDetails={openFileDetailsDialog}
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
    </div>
  );
}
