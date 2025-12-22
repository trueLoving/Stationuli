// 设备页面组件（设备管理中心）
import { ChevronDown, Plus, Search } from "lucide-react";
import { useState } from "react";
import { DeviceCard } from "stationuli-common/components";
import type { DeviceInfo } from "../types";

interface DevicesPageProps {
  // 设备列表
  devices: DeviceInfo[];
  onAddDevice: () => void;
  onTestConnection: (device: DeviceInfo) => void;
  onSendFile: (device: DeviceInfo) => void;
  onOpenWorkspace: (device: DeviceInfo) => void;
  onEditDevice: (device: DeviceInfo) => void;
  onDeleteDevice: (device: DeviceInfo) => void;
  // 服务状态（用于判断是否显示空状态）
  isDiscovering: boolean;
}

export function DevicesPage({
  devices,
  onAddDevice,
  onTestConnection,
  onSendFile,
  onOpenWorkspace,
  onEditDevice,
  onDeleteDevice,
  isDiscovering,
}: DevicesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline"
  >("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 判断设备是否在线（基于 connected 和 lastSeen）
  const isDeviceOnline = (device: DeviceInfo) => {
    if (device.connected) return true;
    // 如果 lastSeen 在 30 秒内，认为设备在线
    if (device.lastSeen) {
      const now = Date.now();
      const timeDiff = now - device.lastSeen;
      return timeDiff < 30000; // 30秒
    }
    return false;
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
              onClick={onAddDevice}
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
              onTestConnection={onTestConnection}
              onSendFile={onSendFile}
              onOpenWorkspace={onOpenWorkspace}
              onEdit={onEditDevice}
              onDelete={onDeleteDevice}
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
    </div>
  );
}
