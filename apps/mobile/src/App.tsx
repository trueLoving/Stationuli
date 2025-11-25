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

const DEFAULT_PORT = 8081; // 移动端端口（与桌面端不同）

type TabType = "transfer" | "control";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("transfer");
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
    <div className="pb-24">
      {/* 头部 */}
      <div className="text-center mb-6 pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 shadow-lg">
          <span className="text-2xl">📡</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
          Stationuli
        </h1>
        <p className="text-gray-600 text-base">快速、安全的文件传输</p>
      </div>

      {/* 设备发现卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">🔍</span>
            设备发现
          </h2>
          {isDiscovering && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">发现中</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {!isDiscovering ? (
            <button
              onClick={startDiscovery}
              className="w-full px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
            >
              <span>▶</span>
              启动设备发现
            </button>
          ) : (
            <button
              onClick={stopDiscovery}
              className="w-full px-5 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
            >
              <span>⏹</span>
              停止设备发现
            </button>
          )}
          <button
            onClick={addDevice}
            className="w-full px-5 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
          >
            <span>➕</span>
            手动添加设备
          </button>
        </div>

        {deviceId && (
          <div className="mb-5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-600 mb-1">本设备 ID</p>
            <p className="font-mono text-xs font-semibold text-gray-800 break-all">
              {deviceId}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-base font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <span>📱</span>
            发现的设备
            <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {devices.length}
            </span>
          </h3>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 text-base mb-1">暂无设备</p>
              <p className="text-gray-400 text-sm">
                请确保设备在同一 WiFi 网络下
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 active:scale-98 transition-all duration-150"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                      {device.device_type === "mobile" ? "📱" : "💻"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm mb-1 truncate">
                        {device.name}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <span>🌐</span>
                          {device.address}:{device.port}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                          {device.device_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFile(device)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-sm"
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
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">📁</span>
          文件选择
        </h2>
        <div className="mb-5">
          <button
            onClick={selectFile}
            className="w-full px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
          >
            <span>📂</span>
            选择文件
          </button>
          {selectedFile && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-xs text-gray-600 mb-1">已选择文件</p>
              <p className="font-mono text-xs font-semibold text-gray-800 break-all">
                {selectedFile.split("/").pop()}
              </p>
            </div>
          )}
        </div>

        {transferProgress > 0 && transferProgress < 100 && (
          <div className="mt-5 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                传输进度
              </span>
              <span className="text-xs font-bold text-green-600">
                {transferProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300 ease-out flex items-center justify-end pr-1.5"
                style={{ width: `${transferProgress}%` }}
              >
                {transferProgress > 15 && (
                  <span className="text-[10px] text-white font-medium">
                    {transferProgress}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 接收的文件卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">📥</span>
          接收的文件
          {receivedFiles.length > 0 && (
            <span className="ml-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {receivedFiles.length}
            </span>
          )}
        </h2>
        {receivedFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 text-base">暂无接收的文件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedFiles.map((file, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 active:scale-98 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm mb-1 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {file.path}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 设备控制页面内容
  const ControlTab = () => (
    <div className="pb-24">
      {/* 头部 */}
      <div className="text-center mb-6 pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-3 shadow-lg">
          <span className="text-2xl">⚙️</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
          设备控制
        </h1>
        <p className="text-gray-600 text-base">管理设备连接和设置</p>
      </div>

      {/* 设备状态卡片 */}
      <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">📊</span>
          设备状态
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
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

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已发现设备</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {devices.length} 个
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
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
              启动设备发现以查找附近的设备
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                    {device.device_type === "mobile" ? "📱" : "💻"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm mb-1 truncate">
                      {device.name}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <span>🌐</span>
                        {device.address}:{device.port}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
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
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-xl">🔧</span>
          操作
        </h2>
        <div className="space-y-3">
          <button
            onClick={isDiscovering ? stopDiscovery : startDiscovery}
            className={`w-full px-5 py-4 rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base ${
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
            className="w-full px-5 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold shadow-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
          >
            <span>➕</span>
            手动添加设备
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mx-auto font-sans min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* 内容区域 */}
      <div className="px-4 py-6 overflow-y-auto pb-24">
        {activeTab === "transfer" ? <TransferTab /> : <ControlTab />}
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => setActiveTab("transfer")}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
              activeTab === "transfer" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-2xl mb-1">📤</span>
            <span className="text-xs font-medium">文件传输</span>
            {activeTab === "transfer" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("control")}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 relative ${
              activeTab === "control" ? "text-purple-600" : "text-gray-500"
            }`}
          >
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-xs font-medium">设备控制</span>
            {activeTab === "control" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
