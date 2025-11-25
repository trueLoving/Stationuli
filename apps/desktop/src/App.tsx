// 临时定义 DeviceInfo 类型，与 Rust 后端匹配
interface DeviceInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  device_type: string;
}
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import "./App.css";

const DEFAULT_PORT = 8080; // 桌面端端口

type TabType = "transfer" | "control";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("transfer");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [receivedFiles, setReceivedFiles] = useState<
    Array<{ name: string; path: string }>
  >([]);

  // 启动设备发现
  const startDiscovery = async () => {
    try {
      await invoke("start_discovery", { port: DEFAULT_PORT });
      setIsDiscovering(true);

      // 获取设备 ID
      const id = await invoke<string>("get_device_id");
      setDeviceId(id);

      // 定期刷新设备列表
      const interval = setInterval(async () => {
        const deviceList = await invoke<DeviceInfo[]>("get_devices");
        setDevices(deviceList);
      }, 2000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Failed to start discovery:", error);
      alert(`启动设备发现失败: ${error}`);
    }
  };

  // 停止设备发现
  const stopDiscovery = async () => {
    try {
      await invoke("stop_discovery");
      setIsDiscovering(false);
      setDevices([]);
    } catch (error) {
      console.error("Failed to stop discovery:", error);
    }
  };

  // 手动添加设备
  const addDevice = async () => {
    const address = prompt("请输入设备 IP 地址:");
    if (!address) return;

    const port = prompt("请输入设备端口 (默认 8080):") || "8080";

    const device: DeviceInfo = {
      id: `manual-${Date.now()}`,
      name: `手动添加的设备 (${address})`,
      address,
      port: parseInt(port, 10),
      device_type: "unknown",
    };

    try {
      await invoke("add_device", { device });
      const deviceList = await invoke<DeviceInfo[]>("get_devices");
      setDevices(deviceList);
    } catch (error) {
      console.error("Failed to add device:", error);
      alert(`添加设备失败: ${error}`);
    }
  };

  // 选择文件
  const selectFile = async () => {
    // 使用 Tauri 的文件选择对话框
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: false,
      directory: false,
    });

    if (selected && typeof selected === "string") {
      setSelectedFile(selected);
    }
  };

  // 发送文件
  const sendFile = async (device: DeviceInfo) => {
    if (!selectedFile) {
      alert("请先选择要发送的文件");
      return;
    }

    try {
      setTransferProgress(0);
      await invoke("send_file", {
        file_path: selectedFile,
        target_address: device.address,
        target_port: device.port,
      });
      // 注意：成功消息会在 transfer-complete 事件中处理
    } catch (error) {
      console.error("Failed to send file:", error);
      alert(`文件发送失败: ${error}`);
      setTransferProgress(0);
    }
  };

  // 监听传输进度事件
  useEffect(() => {
    const progressUnlisten = listen("transfer-progress", (event) => {
      const data = event.payload as { progress: number };
      setTransferProgress(data.progress);
    });

    const completeUnlisten = listen("transfer-complete", (event) => {
      const data = event.payload as { file: string };
      setTransferProgress(100);
      alert(`文件 "${data.file.split("/").pop()}" 发送成功！`);
      // 延迟重置进度条
      setTimeout(() => {
        setTransferProgress(0);
      }, 2000);
    });

    const receivedUnlisten = listen("file-received", (event) => {
      const data = event.payload as { file_name: string; file_path: string };
      setReceivedFiles((prev) => [
        { name: data.file_name, path: data.file_path },
        ...prev,
      ]);
      alert(`文件 "${data.file_name}" 接收成功！`);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
      completeUnlisten.then((unlisten) => unlisten());
      receivedUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  // 文件传输页面内容
  const TransferTab = () => (
    <div className="w-full">
      {/* 头部 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">📡</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Stationuli
        </h1>
        <p className="text-gray-600 text-lg">快速、安全的文件传输工具</p>
      </div>

      {/* 设备发现卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            设备发现
          </h2>
          {isDiscovering && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">发现中...</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          {!isDiscovering ? (
            <button
              onClick={startDiscovery}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span>▶</span>
              启动设备发现
            </button>
          ) : (
            <button
              onClick={stopDiscovery}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span>⏹</span>
              停止设备发现
            </button>
          )}
          <button
            onClick={addDevice}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>➕</span>
            手动添加设备
          </button>
        </div>

        {deviceId && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">本设备 ID</p>
            <p className="font-mono text-sm font-semibold text-gray-800 break-all">
              {deviceId}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <span>📱</span>
            发现的设备
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {devices.length}
            </span>
          </h3>
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg mb-2">暂无设备</p>
              <p className="text-gray-400 text-sm">
                请确保设备在同一 WiFi 网络下
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {device.device_type === "mobile" ? "📱" : "💻"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-1">
                        {device.name}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span>🌐</span>
                          {device.address}:{device.port}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-200 rounded-md text-xs">
                          {device.device_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFile(device)}
                    className="ml-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <span>📤</span>
                    发送文件
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 文件选择卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">📁</span>
          文件选择
        </h2>
        <div className="mb-6">
          <button
            onClick={selectFile}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>📂</span>
            选择文件
          </button>
          {selectedFile && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-sm text-gray-600 mb-1">已选择文件</p>
              <p className="font-mono text-sm font-semibold text-gray-800 break-all">
                {selectedFile.split("/").pop()}
              </p>
            </div>
          )}
        </div>

        {transferProgress > 0 && transferProgress < 100 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                传输进度
              </span>
              <span className="text-sm font-bold text-green-600">
                {transferProgress}%
              </span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300 ease-out flex items-center justify-end pr-2"
                style={{ width: `${transferProgress}%` }}
              >
                {transferProgress > 10 && (
                  <span className="text-xs text-white font-medium">
                    {transferProgress}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 接收的文件卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">📥</span>
          接收的文件
          {receivedFiles.length > 0 && (
            <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {receivedFiles.length}
            </span>
          )}
        </h2>
        {receivedFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">暂无接收的文件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 mb-1 truncate">
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {file.path}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const { openUrl } = await import(
                      "@tauri-apps/plugin-opener"
                    );
                    const parentDir = file.path
                      .split("/")
                      .slice(0, -1)
                      .join("/");
                    await openUrl(parentDir);
                  }}
                  className="ml-4 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <span>📂</span>
                  打开位置
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 设备控制页面内容
  const ControlTab = () => (
    <div className="w-full">
      {/* 头部 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">⚙️</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          设备控制
        </h1>
        <p className="text-gray-600 text-lg">管理设备连接和设置</p>
      </div>

      {/* 设备状态卡片 */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          设备状态
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">发现服务</span>
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

          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已发现设备</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {devices.length} 个
              </span>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">接收的文件</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                {receivedFiles.length} 个
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
            {devices.length}
          </span>
        </h2>
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-2">暂无设备</p>
            <p className="text-gray-400 text-sm">
              启动设备发现以查找附近的设备
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    {device.device_type === "mobile" ? "📱" : "💻"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      {device.name}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>🌐</span>
                        {device.address}:{device.port}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 rounded-md text-xs">
                        {device.device_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
            onClick={isDiscovering ? stopDiscovery : startDiscovery}
            className={`px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${
              isDiscovering
                ? "bg-gradient-to-r from-red-500 to-pink-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            }`}
          >
            <span>{isDiscovering ? "⏹" : "▶"}</span>
            {isDiscovering ? "停止设备发现" : "启动设备发现"}
          </button>
          <button
            onClick={addDevice}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans flex">
      {/* 左侧边栏 */}
      <div
        className={`bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">📡</span>
              </div>
              <span className="font-bold text-gray-800">Stationuli</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? "展开菜单" : "折叠菜单"}
          >
            <span className="text-xl">{sidebarCollapsed ? "▶" : "◀"}</span>
          </button>
        </div>

        {/* 菜单项 */}
        <div className="py-4">
          <button
            onClick={() => setActiveTab("transfer")}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
              activeTab === "transfer"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl flex-shrink-0">📤</span>
            {!sidebarCollapsed && <span className="font-medium">文件传输</span>}
          </button>
          <button
            onClick={() => setActiveTab("control")}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 mt-2 rounded-xl transition-all duration-200 ${
              activeTab === "control"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xl flex-shrink-0">⚙️</span>
            {!sidebarCollapsed && <span className="font-medium">设备控制</span>}
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {activeTab === "transfer" ? <TransferTab /> : <ControlTab />}
        </div>
      </div>
    </div>
  );
}

export default App;
