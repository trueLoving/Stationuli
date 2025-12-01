# 移动端代码结构说明

## 文件结构

```
src/
├── api/                    # API 调用层
│   ├── device.ts          # 设备相关 API（发现、连接、测试等）
│   └── file.ts            # 文件相关 API（选择、发送、保存等）
│
├── components/             # React 组件
│   ├── AddDeviceDialog.tsx      # 添加设备对话框
│   ├── BottomNavigation.tsx     # 底部导航栏
│   ├── ControlTab.tsx           # 设备控制标签页
│   ├── DeviceCard.tsx           # 设备卡片组件
│   ├── FileCard.tsx             # 文件卡片组件
│   ├── FileSelectionCard.tsx    # 文件选择卡片
│   ├── ReceivedFilesCard.tsx    # 接收文件列表卡片
│   ├── ServiceStatusCard.tsx    # 服务状态卡片
│   └── TransferTab.tsx          # 文件传输标签页
│
├── hooks/                 # 自定义 React Hooks
│   ├── useDiscovery.ts    # 设备发现相关状态和逻辑
│   ├── useFileTransfer.ts # 文件传输相关状态和逻辑
│   └── useLogs.ts         # 日志相关状态和逻辑
│
├── types.ts               # TypeScript 类型定义
├── constants.ts           # 常量定义
├── utils.ts               # 工具函数
├── App.tsx                # 主应用组件（简化后）
└── App.css                # 样式文件
```

## 模块说明

### API 层 (`api/`)

- **device.ts**: 封装所有设备相关的 Tauri 命令调用
- **file.ts**: 封装所有文件相关的 Tauri 命令调用

### 组件层 (`components/`)

- **TransferTab.tsx**: 文件传输页面的主要组件
- **ControlTab.tsx**: 设备控制页面的主要组件
- **DeviceCard.tsx**: 可复用的设备卡片组件
- **FileCard.tsx**: 可复用的文件卡片组件
- **ServiceStatusCard.tsx**: 服务状态显示卡片
- **FileSelectionCard.tsx**: 文件选择和进度显示卡片
- **ReceivedFilesCard.tsx**: 接收文件列表卡片
- **AddDeviceDialog.tsx**: 添加设备对话框
- **BottomNavigation.tsx**: 底部导航栏

### Hooks 层 (`hooks/`)

- **useDiscovery.ts**: 管理设备发现、设备列表、服务状态等
- **useFileTransfer.ts**: 管理文件选择、传输进度、接收文件等
- **useLogs.ts**: 管理日志显示和滚动

### 工具层

- **types.ts**: 共享的 TypeScript 类型定义
- **constants.ts**: 应用常量（端口号、文件过滤器等）
- **utils.ts**: 工具函数（文件大小格式化等）

## 优势

1. **模块化**: 代码按功能拆分，易于维护和测试
2. **可复用**: 组件和 Hooks 可以在其他地方复用
3. **类型安全**: 统一的类型定义，减少错误
4. **关注点分离**: UI、业务逻辑、API 调用分离
5. **易于扩展**: 新功能可以轻松添加到相应模块
