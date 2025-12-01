// 主应用组件

import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import * as deviceApi from "./api/device";
import "./App.css";
import { AddDeviceDialog } from "./components/AddDeviceDialog";
import { BottomNavigation } from "./components/BottomNavigation";
import { ControlTab } from "./components/ControlTab";
import { TransferTab } from "./components/TransferTab";
import { useDiscovery } from "./hooks/useDiscovery";
import { useFileTransfer } from "./hooks/useFileTransfer";
import type { DeviceInfo, TabType } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("transfer");
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string>("");
  const [devicePort, setDevicePort] = useState<string>("8080");

  // 使用自定义 Hooks
  const discovery = useDiscovery();
  const fileTransfer = useFileTransfer();

  // 打开添加设备对话框
  const openAddDeviceDialog = () => {
    setDeviceAddress("");
    setDevicePort("8080");
    setShowAddDeviceDialog(true);
  };

  // 关闭添加设备对话框
  const closeAddDeviceDialog = () => {
    setShowAddDeviceDialog(false);
    setDeviceAddress("");
    setDevicePort("8080");
  };

  // 手动添加设备（添加后自动测试连接）
  const handleAddDevice = async () => {
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
      await discovery.addDevice(address, port);
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
      const result = await deviceApi.testConnection(
        device.address,
        device.port
      );
      alert(`✅ ${result}`);
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes("Connection refused")) {
        alert(
          `❌ 连接测试失败: 连接被拒绝\n\n可能的原因：\n1. 桌面端未启动设备发现\n2. IP地址不正确\n3. 端口不匹配\n\n设备信息：\n名称: ${device.name}\n地址: ${device.address}\n端口: ${device.port}\n类型: ${device.device_type}`
        );
      } else {
        alert(`❌ 连接测试失败: ${error}`);
      }
    }
  };

  // 发送文件
  const handleSendFile = async (device: DeviceInfo) => {
    await fileTransfer.sendFile(device.address, device.port);
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

  return (
    <div className="w-full mx-auto font-sans min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* 内容区域 */}
      <div className="px-4 py-6 overflow-y-auto pb-24">
        {activeTab === "transfer" ? (
          <TransferTab
            isDiscovering={discovery.isDiscovering}
            deviceId={discovery.deviceId}
            localIp={discovery.localIp}
            devices={discovery.devices}
            selectedFile={fileTransfer.selectedFile}
            selectedFileName={fileTransfer.selectedFileName}
            selectedFileSize={fileTransfer.selectedFileSize}
            transferProgress={fileTransfer.transferProgress}
            receivedFiles={fileTransfer.receivedFiles}
            onStartDiscovery={discovery.startDiscovery}
            onStopDiscovery={discovery.stopDiscovery}
            onAddDevice={openAddDeviceDialog}
            onSelectFile={fileTransfer.selectFile}
            onClearFile={fileTransfer.clearSelectedFile}
            onTestConnection={handleTestConnection}
            onSendFile={handleSendFile}
            onSaveReceivedFile={fileTransfer.saveReceivedFile}
          />
        ) : (
          <ControlTab
            isDiscovering={discovery.isDiscovering}
            deviceId={discovery.deviceId}
            devices={discovery.devices}
            receivedFilesCount={fileTransfer.receivedFiles.length}
            onStartDiscovery={discovery.startDiscovery}
            onStopDiscovery={discovery.stopDiscovery}
            onAddDevice={openAddDeviceDialog}
            onTestConnection={handleTestConnection}
          />
        )}
      </div>

      {/* 底部导航栏 */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 添加设备对话框 */}
      <AddDeviceDialog
        isOpen={showAddDeviceDialog}
        deviceAddress={deviceAddress}
        devicePort={devicePort}
        onAddressChange={setDeviceAddress}
        onPortChange={setDevicePort}
        onClose={closeAddDeviceDialog}
        onAdd={handleAddDevice}
      />
    </div>
  );
}

export default App;
