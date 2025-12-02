// 设备控制标签页组件

import type { DeviceInfo } from "../types";
import { DeviceCard } from "./DeviceCard";

interface ControlTabProps {
  isDiscovering: boolean;
  deviceId: string;
  devices: DeviceInfo[];
  receivedFilesCount: number;
  isLoading?: boolean;
  onStartDiscovery: () => void;
  onStopDiscovery: () => void;
  onAddDevice: () => void;
  onTestConnection: (device: DeviceInfo) => void;
}

export function ControlTab({
  isDiscovering,
  deviceId,
  devices,
  receivedFilesCount,
  isLoading = false,
  onStartDiscovery,
  onStopDiscovery,
  onAddDevice,
  onTestConnection,
}: ControlTabProps) {
  return (
    <div className="pb-24">
      {/* 设备状态卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">📊</span>
          设备状态
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">服务状态</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isDiscovering
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isDiscovering ? "运行中" : "已停止"}
              </span>
            </div>
            {deviceId && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-1">设备 ID</p>
                <p className="font-mono text-xs font-semibold text-gray-800 break-all">
                  {deviceId}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已添加设备</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {devices.length} 个
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">接收的文件</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                {receivedFilesCount} 个
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 设备列表卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">📱</span>
          设备列表
          <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {devices.length}
          </span>
        </h2>
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 text-base mb-1">暂无设备</p>
            <p className="text-gray-400 text-sm">
              点击"添加设备"按钮手动添加其他设备
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onTestConnection={onTestConnection}
                onSendFile={() => {}}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          操作
        </h2>
        <div className="space-y-3">
          <button
            onClick={isDiscovering ? onStopDiscovery : onStartDiscovery}
            disabled={isLoading}
            className={`w-full px-5 py-4 rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base ${
              isDiscovering
                ? "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span>{isLoading ? "⏳" : isDiscovering ? "⏹" : "▶"}</span>
            {isLoading
              ? isDiscovering
                ? "停止中..."
                : "启动中..."
              : isDiscovering
                ? "停止服务"
                : "启动服务"}
          </button>
          <button
            onClick={onAddDevice}
            className="w-full px-5 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
          >
            <span>➕</span>
            手动添加设备
          </button>
        </div>
      </div>
    </div>
  );
}
