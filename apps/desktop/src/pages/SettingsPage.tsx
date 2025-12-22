// 设置页面组件
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">应用配置</h2>
        <p className="text-gray-500">应用配置页面开发中...</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">关于</h2>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">应用名称：</span>Stationuli
          </p>
          <p className="text-gray-700">
            <span className="font-medium">版本：</span>0.1.0
          </p>
          <p className="text-gray-700">
            <span className="font-medium">描述：</span>个人工作站 P2P
            文件传输与控制解决方案
          </p>
        </div>
      </div>
    </div>
  );
}
