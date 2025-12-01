// 服务状态卡片组件（支持移动端和桌面端样式）

interface ServiceStatusCardProps {
  isDiscovering: boolean;
  deviceId: string;
  localIp: string;
  defaultPort: number;
  onStart: () => void;
  onStop: () => void;
  onAddDevice: () => void;
  children?: React.ReactNode;
  variant?: "mobile" | "desktop";
}

export function ServiceStatusCard({
  isDiscovering,
  deviceId,
  localIp,
  defaultPort,
  onStart,
  onStop,
  onAddDevice,
  children,
  variant = "mobile",
}: ServiceStatusCardProps) {
  const isMobile = variant === "mobile";
  const padding = isMobile ? "p-5" : "p-6";
  const margin = isMobile ? "mb-4" : "mb-6";
  const shadow = isMobile ? "shadow-lg" : "shadow-xl";
  const titleSize = isMobile ? "text-xl" : "text-2xl";
  const titleIconSize = isMobile ? "text-xl" : "text-2xl";
  const headerMargin = isMobile ? "mb-5" : "mb-6";
  const buttonContainerClass = isMobile
    ? "flex flex-col gap-3 mb-5"
    : "flex gap-3 mb-6 flex-wrap";
  const buttonClass = isMobile
    ? "w-full px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2";
  const stopButtonClass = isMobile
    ? "w-full px-5 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2";
  const addButtonClass = isMobile
    ? "w-full px-5 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 text-base"
    : "px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2";
  const infoPadding = isMobile ? "p-3" : "p-4";
  const infoMargin = isMobile ? "mb-5" : "mb-6";
  const statusTextSize = isMobile ? "text-xs" : "text-sm";
  const ipTextSize = isMobile ? "text-xs" : "text-sm";
  const idTextSize = isMobile ? "text-[10px]" : "text-xs";
  const hintTextSize = isMobile ? "text-[10px]" : "text-xs";

  return (
    <div
      className={`bg-white rounded-2xl ${shadow} ${padding} ${margin} border border-gray-100`}
    >
      <div className={`flex items-center justify-between ${headerMargin}`}>
        <h2
          className={`${titleSize} font-bold text-gray-800 flex items-center gap-2`}
        >
          <span className={titleIconSize}>🔌</span>
          服务状态
        </h2>
        {isDiscovering && (
          <div className={`flex items-center gap-2 text-green-600`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`${statusTextSize} font-medium`}>运行中</span>
          </div>
        )}
      </div>

      <div className={buttonContainerClass}>
        {!isDiscovering ? (
          <button onClick={onStart} className={buttonClass}>
            <span>▶</span>
            启动服务
          </button>
        ) : (
          <button onClick={onStop} className={stopButtonClass}>
            <span>⏹</span>
            停止服务
          </button>
        )}
        <button onClick={onAddDevice} className={addButtonClass}>
          <span>➕</span>
          添加设备
        </button>
      </div>

      {isDiscovering && (deviceId || localIp) && (
        <div
          className={`${infoMargin} ${infoPadding} bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100`}
        >
          <div className={isMobile ? "mb-2" : "mb-3"}>
            <p
              className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 ${isMobile ? "mb-1" : "mb-1"}`}
            >
              本设备信息
            </p>
            {localIp && (
              <>
                <p
                  className={`font-mono ${ipTextSize} font-semibold text-gray-800 break-all ${isMobile ? "mb-1" : "mb-2"}`}
                >
                  IP: {localIp}:{defaultPort}
                </p>
                {localIp === "localhost" && isMobile && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-[10px] text-yellow-800 font-medium mb-1">
                      ⚠️ 模拟器环境检测
                    </p>
                    <p className="text-[10px] text-yellow-700">
                      桌面端需要使用以下方式连接：
                    </p>
                    <p className="text-[10px] text-yellow-700 mt-1 font-mono">
                      1. localhost:{defaultPort}
                    </p>
                    <p className="text-[10px] text-yellow-700 font-mono">
                      2. 或使用 adb forward 端口转发
                    </p>
                  </div>
                )}
              </>
            )}
            {deviceId && (
              <p
                className={`font-mono ${idTextSize} text-gray-600 break-all ${isMobile ? "mt-2" : ""}`}
              >
                ID: {deviceId}
              </p>
            )}
          </div>
          {localIp !== "localhost" && isMobile && (
            <p className={`${hintTextSize} text-gray-500 mt-2`}>
              其他设备可以使用上述 IP 和端口添加此设备
            </p>
          )}
          {!isMobile && (
            <>
              <p className={`${hintTextSize} text-gray-500 mt-2`}>
                其他设备可以使用上述 IP 和端口添加此设备
              </p>
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className={`${hintTextSize} text-blue-800 font-medium mb-1`}>
                  💡 连接模拟器中的移动端
                </p>
                <p className={`${hintTextSize} text-blue-700`}>
                  如果移动端在 Android 模拟器中，请使用：
                </p>
                <p className={`${hintTextSize} text-blue-700 mt-1 font-mono`}>
                  localhost:8081
                </p>
                <p className={`${hintTextSize} text-blue-600 mt-1`}>
                  或使用 adb forward 端口转发
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
