// 首页组件（不包含设备相关操作）
import { ReceivedFilesCard } from "stationuli-common/components";
import type { ReceivedFile } from "stationuli-common/types";

interface HomePageProps {
  // 服务状态（用于判断是否显示接收文件）
  isDiscovering: boolean;

  // 接收文件
  receivedFiles: ReceivedFile[];
  onSaveFile: (file: ReceivedFile) => void;
  onDeleteFile: (file: ReceivedFile) => void;
  onShowFileDetails: (file: ReceivedFile) => void;
}

export function HomePage({
  isDiscovering,
  receivedFiles,
  onSaveFile,
  onDeleteFile,
  onShowFileDetails,
}: HomePageProps) {
  return (
    <div className="space-y-4">
      {/* 接收文件卡片（仅在服务启动时显示） */}
      {isDiscovering ? (
        <ReceivedFilesCard
          receivedFiles={receivedFiles}
          onSave={onSaveFile}
          onDelete={onDeleteFile}
          onShowDetails={onShowFileDetails}
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
