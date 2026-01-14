// 工作台组件（设备中心的多功能界面）
import { X, FileText, Monitor, MessageSquare, Share2 } from "lucide-react";
import { useState } from "react";
import { selectFile } from "../api/file";
import { useFileTransferStore } from "../stores/fileTransferStore";
import type { DeviceInfo } from "../types";

interface WorkspaceProps {
  device: DeviceInfo;
  onClose: () => void;
}

type WorkspaceTab = "transfer" | "control" | "message" | "screen";

export function Workspace({ device, onClose }: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("transfer");
  const { sendFile } = useFileTransferStore();

  // 快速发送文件
  const handleQuickTransfer = async () => {
    try {
      const selected = await selectFile(true);
      if (!selected) {
        return; // 用户取消选择
      }

      const filePaths = Array.isArray(selected) ? selected : [selected];
      if (filePaths.length === 0) {
        return;
      }

      // 逐个发送文件
      for (const filePath of filePaths) {
        try {
          await sendFile(device.address, device.port, filePath);
        } catch (error) {
          console.error(`发送文件失败: ${filePath}`, error);
          alert(`❌ 文件发送失败: ${filePath}\n${error}`);
        }
      }
    } catch (error) {
      console.error("文件选择失败:", error);
      alert(`❌ 文件选择失败: ${error}`);
    }
  };

  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "transfer",
      label: "文件传输",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "control",
      label: "设备控制",
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      id: "message",
      label: "消息",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "screen",
      label: "屏幕共享",
      icon: <Share2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col">
        {/* 顶部：设备信息和关闭按钮 */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
              {device.device_type === "mobile" ? (
                <span className="text-white text-xl">📱</span>
              ) : (
                <span className="text-white text-xl">💻</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-800">{device.name}</div>
              <div className="text-sm text-gray-500">
                {device.address}:{device.port}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭工作台"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                    isActive
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "transfer" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-800">
                文件传输
              </div>
              <div className="text-sm text-gray-500">文件传输功能开发中...</div>
              <button
                onClick={handleQuickTransfer}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                快速发送文件
              </button>
            </div>
          )}

          {activeTab === "control" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-800">
                设备控制
              </div>
              <div className="text-sm text-gray-500">设备控制功能开发中...</div>
            </div>
          )}

          {activeTab === "message" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-800">消息</div>
              <div className="text-sm text-gray-500">消息功能开发中...</div>
            </div>
          )}

          {activeTab === "screen" && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-800">
                屏幕共享
              </div>
              <div className="text-sm text-gray-500">屏幕共享功能开发中...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
