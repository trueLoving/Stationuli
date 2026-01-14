// 设备页面组件（设备管理中心）
import { ChevronDown, Plus, Search } from "lucide-react";
import { useState } from "react";
import { DeviceCard } from "stationuli-common/components";
import { selectFile } from "../api/file";
import { AddDeviceDialog } from "../components/AddDeviceDialog";
import { Workspace } from "../components/Workspace";
import { useDiscoveryStore } from "../stores/discoveryStore";
import { useFileTransferStore } from "../stores/fileTransferStore";
import type { DeviceInfo } from "../types";

export function DevicesPage() {
  // 从 store 获取数据
  const {
    devices,
    isDiscovering,
    addDevice,
    removeDevice,
    updateDevice,
    testConnection,
  } = useDiscoveryStore();
  const { sendFile } = useFileTransferStore();

  // 工作台状态（页面级）
  const [workspaceDevice, setWorkspaceDevice] = useState<DeviceInfo | null>(
    null
  );

  // 页面级状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 设备对话框状态
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [deviceAddress, setDeviceAddress] = useState<string>("");
  const [devicePort, setDevicePort] = useState<string>("8080");
  const [deviceName, setDeviceName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("unknown");
  const [deviceId, setDeviceId] = useState<string>("");

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

  // 添加设备
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
      await addDevice(
        address,
        port,
        deviceName.trim() || undefined,
        deviceType !== "unknown" ? deviceType : undefined,
        deviceId.trim() || undefined
      );
      closeAddDeviceDialog();

      // 添加后自动测试连接
      try {
        const result = await testConnection(address, port);
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
        address: address,
        port: port,
        device_type: deviceType !== "unknown" ? deviceType : "unknown",
      };
      await updateDevice(updatedDevice);
      closeAddDeviceDialog();
      alert(`✅ 设备已更新！`);
    } catch (error) {
      const errorMsg = String(error);
      alert(`❌ 更新设备失败: ${errorMsg}`);
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

      const result = await testConnection(address, device.port);
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
          await sendFile(device.address, device.port, filePath);
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

  // 打开工作台
  const handleOpenWorkspace = (device: DeviceInfo) => {
    setWorkspaceDevice(device);
  };

  // 关闭工作台
  const handleCloseWorkspace = () => {
    setWorkspaceDevice(null);
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
      await removeDevice(device.id);
      alert(`✅ 设备 "${device.name}" 已删除`);
    } catch (error) {
      console.error("Failed to delete device:", error);
      alert(`❌ 删除设备失败: ${error}`);
    }
  };

  // 判断设备是否在线（简化版本，目前所有设备都视为在线）
  // TODO: 未来可以根据实际连接状态来判断
  const isDeviceOnline = (_device: DeviceInfo) => {
    // 目前所有设备都视为在线，未来可以根据实际连接状态来判断
    return true;
  };

  // 计算设备统计
  const onlineDevices = devices.filter((d) => isDeviceOnline(d));
  const offlineDevices = devices.filter((d) => !isDeviceOnline(d));

  // 过滤设备
  const filteredDevices = devices.filter((device) => {
    // 搜索过滤
    const matchesSearch =
      searchQuery === "" ||
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${device.address}:${device.port}`.includes(searchQuery.toLowerCase());

    // 状态过滤
    let matchesStatus = true;
    if (filterStatus === "online") {
      matchesStatus = isDeviceOnline(device);
    } else if (filterStatus === "offline") {
      matchesStatus = !isDeviceOnline(device);
    }

    return matchesSearch && matchesStatus;
  });

  const getFilterLabel = () => {
    switch (filterStatus) {
      case "online":
        return "在线";
      case "offline":
        return "离线";
      default:
        return "全部";
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📱</span>
              设备管理
              {devices.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {devices.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              管理您的设备，进行文件传输和设备控制
            </p>
          </div>
          {isDiscovering && (
            <button
              onClick={openAddDeviceDialog}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
              aria-label="添加设备"
            >
              <Plus className="w-4 h-4" />
              <span>添加设备</span>
            </button>
          )}
        </div>

        {/* 搜索和筛选栏 */}
        {devices.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="搜索设备名称或地址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all flex items-center gap-2 text-sm font-medium text-gray-700 bg-white"
                aria-label="筛选设备状态"
              >
                <span>{getFilterLabel()}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => {
                        setFilterStatus("all");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        filterStatus === "all"
                          ? "text-blue-600 font-medium bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      全部
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("online");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        filterStatus === "online"
                          ? "text-blue-600 font-medium bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      在线
                    </button>
                    <button
                      onClick={() => {
                        setFilterStatus("offline");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        filterStatus === "offline"
                          ? "text-blue-600 font-medium bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      离线
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 设备列表 */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDiscovering ? "暂无设备" : "请先启动服务"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {isDiscovering
                ? "服务已启动，等待设备连接或手动添加设备"
                : "启动服务后可以自动发现设备或手动添加设备"}
            </p>
          </div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <p className="text-gray-500">未找到匹配的设备</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
            >
              清除筛选条件
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onTestConnection={handleTestConnection}
              onSendFile={handleSendFile}
              onOpenWorkspace={handleOpenWorkspace}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
              variant="desktop"
            />
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {devices.length}
            </div>
            <div className="text-sm text-gray-500 font-medium">总设备数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {onlineDevices.length}
            </div>
            <div className="text-sm text-gray-500 font-medium">在线设备</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {offlineDevices.length}
            </div>
            <div className="text-sm text-gray-500 font-medium">离线设备</div>
          </div>
        </div>
      )}

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

      {/* 工作台（模态窗口） */}
      {workspaceDevice && (
        <Workspace device={workspaceDevice} onClose={handleCloseWorkspace} />
      )}
    </div>
  );
}
