// 文件传输标签页组件

import type { DeviceInfo, ReceivedFile } from "../types";
import { DeviceCard } from "./DeviceCard";
import { FileSelectionCard } from "./FileSelectionCard";
import { ReceivedFilesCard } from "./ReceivedFilesCard";
import { ServiceStatusCard } from "./ServiceStatusCard";

interface TransferTabProps {
  isDiscovering: boolean;
  deviceId: string;
  localIp: string;
  devices: DeviceInfo[];
  selectedFile: string;
  selectedFileName: string;
  selectedFileSize: number;
  transferProgress: number;
  receivedFiles: ReceivedFile[];
  isLoading?: boolean;
  onStartDiscovery: () => void;
  onStopDiscovery: () => void;
  onAddDevice: () => void;
  onSelectFile: () => void;
  onClearFile: () => void;
  onTestConnection: (device: DeviceInfo) => void;
  onSendFile: (device: DeviceInfo) => void;
  onSaveReceivedFile: (file: ReceivedFile) => void;
}

export function TransferTab({
  isDiscovering,
  deviceId,
  localIp,
  devices,
  selectedFile,
  selectedFileName,
  selectedFileSize,
  transferProgress,
  receivedFiles,
  isLoading = false,
  onStartDiscovery,
  onStopDiscovery,
  onAddDevice,
  onSelectFile,
  onClearFile,
  onTestConnection,
  onSendFile,
  onSaveReceivedFile,
}: TransferTabProps) {
  return (
    <div className="pb-24">
      <ServiceStatusCard
        isDiscovering={isDiscovering}
        deviceId={deviceId}
        localIp={localIp}
        onStart={onStartDiscovery}
        onStop={onStopDiscovery}
        onAddDevice={onAddDevice}
        isLoading={isLoading}
      >
        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <span>📱</span>
            已添加的设备
            <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {devices.length}
            </span>
          </h3>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">➕</div>
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
                  onSendFile={onSendFile}
                />
              ))}
            </div>
          )}
        </div>
      </ServiceStatusCard>

      <FileSelectionCard
        selectedFile={selectedFile}
        selectedFileName={selectedFileName}
        selectedFileSize={selectedFileSize}
        transferProgress={transferProgress}
        onSelectFile={onSelectFile}
        onClearFile={onClearFile}
      />

      <ReceivedFilesCard
        receivedFiles={receivedFiles}
        onSave={onSaveReceivedFile}
      />
    </div>
  );
}
