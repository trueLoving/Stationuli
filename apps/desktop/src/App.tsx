// 主应用组件

import { listen } from "@tauri-apps/api/event";
import { Plus, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import * as deviceApi from "./api/device";
import "./App.css";
import { AddDeviceDialog } from "./components/AddDeviceDialog";
import { DeviceCard } from "./components/DeviceCard";
import { FileSelectionCard } from "./components/FileSelectionCard";
import { ReceivedFilesCard } from "./components/ReceivedFilesCard";
import { ServiceStatusCard } from "./components/ServiceStatusCard";
import { Sidebar } from "./components/Sidebar";
import { useDiscovery } from "./hooks/useDiscovery";
import { useFileTransfer } from "./hooks/useFileTransfer";
import type { DeviceInfo, TabType } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("transfer");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string>("");
  const [devicePort, setDevicePort] = useState<string>("8080");
  const [deviceName, setDeviceName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("unknown");
  const [deviceId, setDeviceId] = useState<string>("");

  // 使用自定义 Hooks
  const discovery = useDiscovery();
  const fileTransfer = useFileTransfer();

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B 切换侧边栏
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      // Ctrl/Cmd + 1 切换到文件传输
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setActiveTab("transfer");
      }
      // Ctrl/Cmd + 2 切换到设备控制
      if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        setActiveTab("control");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarCollapsed]);

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

  // 文件传输页面内容
  const TransferTab = () => (
    <div className="w-full">
      <ServiceStatusCard
        isDiscovering={discovery.isDiscovering}
        deviceId={discovery.deviceId}
        localIp={discovery.localIp}
        onStart={discovery.startDiscovery}
        onStop={discovery.stopDiscovery}
        onAddDevice={openAddDeviceDialog}
        isLoading={discovery.isLoading}
      >
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
            已添加的设备
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {discovery.devices.length}
            </span>
          </h3>
          {discovery.devices.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <Plus
                    className="w-10 h-10 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-lg mb-2 font-medium">暂无设备</p>
              <p className="text-gray-400 text-sm">
                点击"添加设备"按钮手动添加其他设备
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {discovery.devices.map((device: DeviceInfo) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onTestConnection={handleTestConnection}
                  onSendFile={handleSendFile}
                />
              ))}
            </div>
          )}
        </div>
      </ServiceStatusCard>

      <FileSelectionCard
        selectedFile={fileTransfer.selectedFile}
        selectedFileName={fileTransfer.selectedFileName}
        selectedFileSize={fileTransfer.selectedFileSize}
        transferProgress={fileTransfer.transferProgress}
        onSelectFile={fileTransfer.selectFile}
        onClearFile={fileTransfer.clearSelectedFile}
        onFileDrop={async (file: File) => {
          // 处理拖拽的文件
          try {
            // 在 Tauri 桌面应用中，我们可以读取文件内容
            // 但由于安全限制，无法直接获取完整路径
            // 这里我们提示用户使用文件选择器
            // 未来可以使用 Tauri 的拖拽事件 API 来获取完整路径
            await file.arrayBuffer();
            const fileName = file.name;

            // 由于无法获取完整路径，我们提示用户
            // 实际应用中，应该使用 Tauri 的文件拖拽事件
            alert(
              `已检测到文件: ${fileName}\n由于浏览器安全限制，请使用"选择文件"按钮选择文件。`
            );
          } catch (error) {
            console.error("处理拖拽文件失败:", error);
          }
        }}
      />

      <ReceivedFilesCard
        receivedFiles={fileTransfer.receivedFiles}
        onSave={fileTransfer.saveReceivedFile}
      />
    </div>
  );

  // 设备控制页面内容
  const ControlTab = () => (
    <div className="w-full">
      {/* 设备状态卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          设备状态
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">服务状态</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  discovery.isDiscovering
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {discovery.isDiscovering ? "运行中" : "已停止"}
              </span>
            </div>
            {discovery.deviceId && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-1">设备 ID</p>
                <p className="font-mono text-xs font-semibold text-gray-800 break-all">
                  {discovery.deviceId}
                </p>
              </div>
            )}
          </div>

          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已添加设备</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {discovery.devices.length} 个
              </span>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">接收的文件</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                {fileTransfer.receivedFiles.length} 个
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 设备列表卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">📱</span>
          设备列表
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {discovery.devices.length}
          </span>
        </h2>
        {discovery.devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-2">暂无设备</p>
            <p className="text-gray-400 text-sm">
              点击"添加设备"按钮手动添加其他设备
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {discovery.devices.map((device: DeviceInfo) => (
              <DeviceCard
                key={device.id}
                device={device}
                onTestConnection={handleTestConnection}
                onSendFile={() => {}}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          操作
        </h2>
        <div className="flex gap-3">
          <button
            onClick={
              discovery.isDiscovering
                ? discovery.stopDiscovery
                : discovery.startDiscovery
            }
            disabled={discovery.isLoading}
            className={`px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${
              discovery.isDiscovering
                ? "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            } ${discovery.isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span>
              {discovery.isLoading
                ? "⏳"
                : discovery.isDiscovering
                  ? "⏹"
                  : "▶"}
            </span>
            {discovery.isLoading
              ? discovery.isDiscovering
                ? "停止中..."
                : "启动中..."
              : discovery.isDiscovering
                ? "停止服务"
                : "启动服务"}
          </button>
          <button
            onClick={openAddDeviceDialog}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>➕</span>
            手动添加设备
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans flex overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        sidebarCollapsed={sidebarCollapsed}
        onTabChange={setActiveTab}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-5xl xl:max-w-7xl mx-auto px-6 py-8">
          {activeTab === "transfer" ? <TransferTab /> : <ControlTab />}
        </div>
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
    </div>
  );
}

export default App;
