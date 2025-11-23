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
    <div className="container">
      <h1>Stationuli - 文件传输</h1>

      <div className="section">
        <h2>设备发现</h2>
        <div className="controls">
          {!isDiscovering ? (
            <button onClick={startDiscovery}>启动设备发现</button>
          ) : (
            <button onClick={stopDiscovery}>停止设备发现</button>
          )}
          <button onClick={addDevice}>手动添加设备</button>
        </div>

        {deviceId && <p className="device-id">本设备 ID: {deviceId}</p>}

        <div className="devices">
          <h3>发现的设备 ({devices.length})</h3>
          {devices.length === 0 ? (
            <p>暂无设备，请确保设备在同一 WiFi 网络下</p>
          ) : (
            <ul>
              {devices.map((device) => (
                <li key={device.id} className="device-item">
                  <div>
                    <strong>{device.name}</strong>
                    <br />
                    <span className="device-info">
                      {device.address}:{device.port} ({device.device_type})
                    </span>
                  </div>
                  <button onClick={() => sendFile(device)}>发送文件</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="section">
        <h2>文件选择</h2>
        <div className="file-selector">
          <button onClick={selectFile}>选择文件</button>
          {selectedFile && (
            <p className="selected-file">
              已选择: {selectedFile.split("/").pop()}
            </p>
          )}
        </div>

        {transferProgress > 0 && transferProgress < 100 && (
          <div className="progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${transferProgress}%` }}
              />
            </div>
            <span>{transferProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
