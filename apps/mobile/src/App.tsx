// 主应用组件
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { DevTools } from "stationuli-common/components";
import type { ReceivedFile } from "stationuli-common/types";
import * as deviceApi from "./api/device";
import { selectFile } from "./api/file";
import { fileApiAdapter } from "./api/fileAdapter";
import "./App.css";
import { AddDeviceDialog } from "./components/AddDeviceDialog";
import { FileDetailsDialog } from "./components/FileDetailsDialog";
import { Layout } from "./components/Layout";
import { DEFAULT_PORT } from "./constants";
import { useDiscovery } from "./hooks/useDiscovery";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { DevicesPage } from "./pages/DevicesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAppStore } from "./stores/appStore";
import type { DeviceInfo } from "./types";

function App() {
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string>("");
  const [devicePort, setDevicePort] = useState<string>("8080");
  const [deviceName, setDeviceName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("unknown");
  const [deviceId, setDeviceId] = useState<string>("");
  const [showFileDetailsDialog, setShowFileDetailsDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ReceivedFile | null>(null);

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
      alert("请输入设备 IP 地址和端口\n格式：192.168.1.100:8080");
      return;
    }

    const port = parseInt(devicePort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      alert("端口号无效，请输入 1-65535 之间的数字\n格式：192.168.1.100:8080");
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

  // 发送文件（支持多选）
  const handleSendFile = async (device: DeviceInfo) => {
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

  // 打开工作台（占位）
  const handleOpenWorkspace = (device: DeviceInfo) => {
    alert(
      `工作台功能开发中...\n设备: ${device.name}\n地址: ${device.address}:${device.port}`
    );
  };

  // 编辑设备
  const handleEditDevice = (device: DeviceInfo) => {
    setDeviceAddress(device.address ?? "");
    setDevicePort(device.port.toString());
    setDeviceName(device.name ?? "");
    setDeviceType(device.device_type ?? "unknown");
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
      alert("请输入设备 IP 地址和端口\n格式：192.168.1.100:8080");
      return;
    }

    const port = parseInt(devicePort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      alert("端口号无效，请输入 1-65535 之间的数字\n格式：192.168.1.100:8080");
      return;
    }

    try {
      const updatedDevice: DeviceInfo = {
        id: deviceId,
        name: deviceName.trim() || `手动添加的设备 (${address}:${port})`,
        address,
        port,
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

  // 监听传输进度事件
  useEffect(() => {
    const progressUnlisten = listen("transfer-progress", (event) => {
      const data = event.payload as { progress: number };
      fileTransfer.setTransferProgress(data.progress);
    });

    const completeUnlisten = listen("transfer-complete", (event) => {
      const data = event.payload as { file: string };
      fileTransfer.setTransferProgress(100);
      // 使用已存储的文件名（包含后缀），如果没有则从路径提取
      const fileName =
        fileTransfer.selectedFileName ||
        data.file.split("/").pop() ||
        data.file;
      alert(`✅ 文件发送成功！\n文件名: ${fileName}`);
      setTimeout(() => {
        fileTransfer.setTransferProgress(0);
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

      fileTransfer.addReceivedFile({
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
  }, [fileTransfer]);

  const currentPage = useAppStore((state) => state.currentPage);

  // 渲染页面内容
  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            isDiscovering={discovery.isDiscovering}
            receivedFiles={fileTransfer.receivedFiles}
            onSaveFile={fileTransfer.saveReceivedFile}
            onDeleteFile={fileTransfer.removeReceivedFile}
            onShowFileDetails={(file) => {
              setSelectedFile(file);
              setShowFileDetailsDialog(true);
            }}
          />
        );
      case "devices":
        return (
          <DevicesPage
            devices={discovery.devices}
            onAddDevice={openAddDeviceDialog}
            onTestConnection={handleTestConnection}
            onSendFile={handleSendFile}
            onOpenWorkspace={handleOpenWorkspace}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
            isDiscovering={discovery.isDiscovering}
          />
        );
      case "history":
        return <HistoryPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full mx-auto font-sans min-h-screen bg-gray-50 relative">
      <Layout
        isDiscovering={discovery.isDiscovering}
        localIp={discovery.localIp}
        defaultPort={DEFAULT_PORT}
        onStartDiscovery={discovery.startDiscovery}
        onStopDiscovery={discovery.stopDiscovery}
        isLoading={discovery.isLoading}
      >
        {renderPageContent()}
      </Layout>

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

      {/* 文件详情对话框 */}
      <FileDetailsDialog
        isOpen={showFileDetailsDialog}
        file={selectedFile}
        onClose={() => {
          setShowFileDetailsDialog(false);
          setSelectedFile(null);
        }}
      />

      {/* 开发工具 */}
      <DevTools variant="mobile" />
    </div>
  );
}

export default App;
