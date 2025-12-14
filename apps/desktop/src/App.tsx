// 主应用组件

import { listen } from "@tauri-apps/api/event";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { DevTools, WelcomeEmptyState } from "stationuli-common/components";
import * as deviceApi from "./api/device";
import "./App.css";
import { AddDeviceDialog } from "./components/AddDeviceDialog";
import { DeviceCard } from "./components/DeviceCard";
import { ReceivedFilesCard } from "./components/ReceivedFilesCard";
import { ServiceStatusCard } from "./components/ServiceStatusCard";
import { ProjectionControl } from "./components/ProjectionControl";
import { useDiscovery } from "./hooks/useDiscovery";
import { useFileTransfer } from "./hooks/useFileTransfer";
import type { DeviceInfo } from "./types";

function App() {
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string>("");
  const [devicePort, setDevicePort] = useState<string>("8080");
  const [deviceName, setDeviceName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("unknown");
  const [deviceId, setDeviceId] = useState<string>("");

  // 使用自定义 Hooks
  const discovery = useDiscovery();
  const fileTransfer = useFileTransfer();

  // 打开添加设备对话框
  const openAddDeviceDialog = () => {
    setDeviceAddress("");
    setDevicePort("8080");
    setDeviceName("");
    setDeviceType("unknown");
    setDeviceId("");
    setShowAddDeviceDialog(true);
  };

  // 关闭添加设备对话框
  const closeAddDeviceDialog = () => {
    setShowAddDeviceDialog(false);
    setDeviceAddress("");
    setDevicePort("8080");
    setDeviceName("");
    setDeviceType("unknown");
    setDeviceId("");
  };

  // 手动添加设备（添加后自动测试连接）
  const handleAddDevice = async () => {
    // 如果是编辑模式（有 deviceId），则更新设备
    if (deviceId) {
      await handleUpdateDevice();
      return;
    }
    const address = deviceAddress.trim();
    if (!address) {
      alert("请输入设备 IP 地址");
      return;
    }

    const port = parseInt(devicePort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      alert("端口号无效，请输入 1-65535 之间的数字");
      return;
    }

    try {
      await discovery.addDevice(
        address,
        port,
        deviceName.trim() || undefined,
        deviceType !== "unknown" ? deviceType : undefined,
        deviceId.trim() || undefined
      );
      closeAddDeviceDialog();

      // 添加后自动测试连接
      try {
        const result = await deviceApi.testConnection(address, port);
        alert(`✅ 设备添加成功！\n${result}`);
      } catch (error) {
        const errorMsg = String(error);
        alert(
          `⚠️ 设备已添加，但连接测试失败：\n${errorMsg}\n\n请检查：\n1. 目标设备是否已启动服务\n2. IP地址和端口是否正确\n3. 网络是否连通`
        );
      }
    } catch (error) {
      const errorMsg = String(error);
      alert(`❌ 添加设备失败: ${errorMsg}\n\n请检查控制台获取更多信息。`);
    }
  };

  // 测试连接
  const handleTestConnection = async (device: DeviceInfo) => {
    try {
      const address = (device.address || "").trim();
      if (!address) {
        alert(
          `❌ 连接测试失败: 设备地址为空\n\n设备信息：\n名称: ${device.name}\n地址: ${device.address}\n端口: ${device.port}`
        );
        return;
      }

      const result = await deviceApi.testConnection(address, device.port);
      alert(`✅ ${result}`);
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes("Connection refused")) {
        alert(
          `❌ 连接测试失败: 连接被拒绝\n\n可能的原因：\n1. 移动端未启动设备发现\n2. IP地址不正确（模拟器环境需要特殊配置）\n3. 端口不匹配\n\n设备信息：\n名称: ${device.name}\n地址: ${device.address}\n端口: ${device.port}\n类型: ${device.device_type}`
        );
      } else if (
        errorMsg.includes("Invalid address") ||
        errorMsg.includes("invalid socket address")
      ) {
        alert(
          `❌ 连接测试失败: IP 地址格式无效\n\n设备信息：\n名称: ${device.name}\n地址: "${device.address}"\n端口: ${device.port}\n类型: ${device.device_type}\n\n请检查地址格式是否正确（应为 IPv4 地址，如 192.168.1.100）`
        );
      } else {
        alert(`❌ 连接测试失败: ${error}`);
      }
    }
  };

  // 发送文件（支持多选）
  const handleSendFile = async (device: DeviceInfo) => {
    try {
      const { selectFile } = await import("./api/file");
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
          await fileTransfer.sendFile(device.address, device.port, filePath);
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

  // 监听传输进度事件
  useEffect(() => {
    const progressUnlisten = listen("transfer-progress", (event) => {
      const data = event.payload as { progress: number };
      fileTransfer.setTransferProgress(data.progress);
    });

    const completeUnlisten = listen("transfer-complete", (event) => {
      const data = event.payload as { file: string };
      fileTransfer.setTransferProgress(100);
      const fileName = data.file.split("/").pop() || data.file;
      alert(`✅ 文件发送成功！\n文件名: ${fileName}\n路径: ${data.file}`);
      setTimeout(() => {
        fileTransfer.setTransferProgress(0);
      }, 2000);
    });

    const receivedUnlisten = listen("file-received", (event) => {
      const data = event.payload as { file_name: string; file_path: string };
      fileTransfer.addReceivedFile({
        name: data.file_name,
        path: data.file_path,
      });
      alert(`文件 "${data.file_name}" 接收成功！`);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
      completeUnlisten.then((unlisten) => unlisten());
      receivedUnlisten.then((unlisten) => unlisten());
    };
  }, [fileTransfer]);

  // 打开工作台（占位）
  const handleOpenWorkspace = (device: DeviceInfo) => {
    alert(
      `工作台功能开发中...\n设备: ${device.name}\n地址: ${device.address}:${device.port}`
    );
  };

  // 编辑设备
  const handleEditDevice = (device: DeviceInfo) => {
    setDeviceAddress(device.address || "");
    setDevicePort(device.port.toString());
    setDeviceName(device.name || "");
    setDeviceType(device.device_type || "unknown");
    setDeviceId(device.id);
    setShowAddDeviceDialog(true);
  };

  // 删除设备
  const handleDeleteDevice = async (device: DeviceInfo) => {
    try {
      await discovery.removeDevice(device.id);
      alert(`✅ 设备 "${device.name}" 已删除`);
    } catch (error) {
      console.error("Failed to delete device:", error);
      alert(`❌ 删除设备失败: ${error}`);
    }
  };

  // 更新设备（编辑后保存）
  const handleUpdateDevice = async () => {
    const address = deviceAddress.trim();
    if (!address) {
      alert("请输入设备 IP 地址");
      return;
    }

    const port = parseInt(devicePort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      alert("端口号无效，请输入 1-65535 之间的数字");
      return;
    }

    try {
      const updatedDevice: DeviceInfo = {
        id: deviceId,
        name: deviceName.trim() || `手动添加的设备 (${address}:${port})`,
        address: address,
        port: port,
        device_type: deviceType !== "unknown" ? deviceType : "unknown",
      };
      await discovery.updateDevice(updatedDevice);
      closeAddDeviceDialog();
      alert(`✅ 设备已更新！`);
    } catch (error) {
      const errorMsg = String(error);
      alert(`❌ 更新设备失败: ${errorMsg}`);
    }
  };

  // 判断是否显示完整界面（有设备或服务已启动时显示）
  const hasDevices = discovery.devices.length > 0;
  const showFullInterface = hasDevices || discovery.isDiscovering;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans">
      {/* 主内容区域 */}
      <div className="max-w-5xl xl:max-w-7xl mx-auto px-6 py-8">
        {!showFullInterface ? (
          // 初始状态：无设备且服务未启动时只显示添加设备入口
          <div className="flex items-center justify-center min-h-[70vh] py-12">
            <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100 w-full max-w-3xl">
              <WelcomeEmptyState
                onStartService={discovery.startDiscovery}
                onStopService={discovery.stopDiscovery}
                isDiscovering={discovery.isDiscovering}
                deviceId={discovery.deviceId}
                localIp={discovery.localIp}
                defaultPort={8080}
                isLoading={discovery.isLoading}
                variant="desktop"
              />
            </div>
          </div>
        ) : (
          // 有设备或服务已启动后显示完整界面
          <>
            {/* 顶部：服务状态卡片 */}
            <ServiceStatusCard
              isDiscovering={discovery.isDiscovering}
              deviceId={discovery.deviceId}
              localIp={discovery.localIp}
              onStart={discovery.startDiscovery}
              onStop={discovery.stopDiscovery}
              onAddDevice={openAddDeviceDialog}
              isLoading={discovery.isLoading}
            />

            {/* 中间：设备列表区域（有设备时显示） */}
            {hasDevices && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  设备列表
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {discovery.devices.length}
                  </span>
                </h2>
                <div className="grid gap-3">
                  {discovery.devices.map((device: DeviceInfo) => (
                    <div key={device.id} className="space-y-2">
                      <DeviceCard
                        device={device}
                        onTestConnection={handleTestConnection}
                        onSendFile={handleSendFile}
                        onOpenWorkspace={handleOpenWorkspace}
                        onEdit={handleEditDevice}
                        onDelete={handleDeleteDevice}
                      />
                      <div className="ml-20">
                        <ProjectionControl device={device} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 无设备但服务已启动时，显示提示信息 */}
            {!hasDevices && discovery.isDiscovering && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  设备列表
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    0
                  </span>
                </h2>
                <div className="text-center py-8">
                  <p className="text-gray-500 text-base mb-4">
                    服务已启动，等待设备连接或添加设备
                  </p>
                  <button
                    onClick={openAddDeviceDialog}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" aria-hidden="true" />
                    添加设备
                  </button>
                </div>
              </div>
            )}

            {/* 底部：接收的文件区域（服务已启动时显示） */}
            {discovery.isDiscovering && (
              <ReceivedFilesCard
                receivedFiles={fileTransfer.receivedFiles}
                onSave={fileTransfer.saveReceivedFile}
                onDelete={fileTransfer.removeReceivedFile}
              />
            )}
          </>
        )}
      </div>

      {/* 添加设备对话框 */}
      <AddDeviceDialog
        isOpen={showAddDeviceDialog}
        deviceAddress={deviceAddress}
        devicePort={devicePort}
        deviceName={deviceName}
        deviceType={deviceType}
        deviceId={deviceId}
        onAddressChange={setDeviceAddress}
        onPortChange={setDevicePort}
        onNameChange={setDeviceName}
        onTypeChange={setDeviceType}
        onIdChange={setDeviceId}
        onClose={closeAddDeviceDialog}
        onAdd={handleAddDevice}
      />

      {/* 开发工具 */}
      <DevTools variant="desktop" />
    </div>
  );
}

export default App;
