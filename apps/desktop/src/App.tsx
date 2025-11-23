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

const DEFAULT_PORT = 8080;

function App() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [transferProgress, setTransferProgress] = useState<number>(0);

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
        filePath: selectedFile,
        targetAddress: device.address,
        targetPort: device.port,
      });
      alert("文件发送成功！");
      setTransferProgress(100);
    } catch (error) {
      console.error("Failed to send file:", error);
      alert(`文件发送失败: ${error}`);
    }
  };

  // 监听传输进度事件
  useEffect(() => {
    const progressUnlisten = listen("transfer-progress", (event) => {
      const data = event.payload as { progress: number };
      setTransferProgress(data.progress);
    });

    const completeUnlisten = listen("transfer-complete", () => {
      setTransferProgress(100);
    });

    return () => {
      progressUnlisten.then((unlisten) => unlisten());
      completeUnlisten.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 font-sans">
      <h1 className="text-gray-800 text-center text-3xl font-bold mb-8">
        Stationuli - 文件传输
      </h1>

      <div className="my-8 p-5 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">设备发现</h2>
        <div className="flex gap-2.5 mb-4">
          {!isDiscovering ? (
            <button
              onClick={startDiscovery}
              className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 transition-colors"
            >
              启动设备发现
            </button>
          ) : (
            <button
              onClick={stopDiscovery}
              className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 transition-colors"
            >
              停止设备发现
            </button>
          )}
          <button
            onClick={addDevice}
            className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 transition-colors"
          >
            手动添加设备
          </button>
        </div>

        {deviceId && (
          <p className="p-2.5 bg-blue-50 rounded font-mono text-xs mb-4">
            本设备 ID: {deviceId}
          </p>
        )}

        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">
            发现的设备 ({devices.length})
          </h3>
          {devices.length === 0 ? (
            <p className="text-gray-600">
              暂无设备，请确保设备在同一 WiFi 网络下
            </p>
          ) : (
            <ul className="list-none p-0">
              {devices.map((device) => (
                <li
                  key={device.id}
                  className="flex justify-between items-center p-4 my-2.5 bg-white rounded shadow-sm"
                >
                  <div>
                    <strong className="text-gray-800">{device.name}</strong>
                    <br />
                    <span className="text-gray-600 text-xs">
                      {device.address}:{device.port} ({device.device_type})
                    </span>
                  </div>
                  <button
                    onClick={() => sendFile(device)}
                    className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 transition-colors"
                  >
                    发送文件
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="my-8 p-5 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">文件选择</h2>
        <div className="my-4">
          <button
            onClick={selectFile}
            className="px-5 py-2.5 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 transition-colors"
          >
            选择文件
          </button>
          {selectedFile && (
            <p className="mt-2.5 p-2.5 bg-blue-50 rounded font-mono text-sm">
              已选择: {selectedFile.split("/").pop()}
            </p>
          )}
        </div>

        {transferProgress > 0 && transferProgress < 100 && (
          <div className="mt-4">
            <div className="w-full h-5 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-300"
                style={{ width: `${transferProgress}%` }}
              />
            </div>
            <span className="block mt-2 text-sm text-gray-600">
              {transferProgress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
