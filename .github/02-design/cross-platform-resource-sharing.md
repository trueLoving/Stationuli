# 跨平台资源共享设计方案

## 概述

Stationuli 项目采用 Monorepo 架构，通过 `packages/common` 包实现桌面端（Desktop）和移动端（Mobile）之间的资源共享，最大化代码复用，减少维护成本。

## 架构设计

### 1. 项目结构

```
Stationuli/
├── apps/
│   ├── desktop/          # 桌面端应用（Tauri + React）
│   └── mobile/           # 移动端应用（Tauri + React）
├── packages/
│   ├── common/           # 共享资源包（核心）
│   │   ├── src/
│   │   │   ├── api/      # API 接口定义
│   │   │   ├── components/  # 共享 UI 组件
│   │   │   ├── hooks/    # 共享 React Hooks
│   │   │   ├── stores/   # 共享状态管理
│   │   │   ├── types/    # 共享类型定义
│   │   │   └── utils/    # 共享工具函数
│   │   └── package.json
│   └── core/             # Rust 核心库（共享后端逻辑）
└── package.json
```

### 2. 资源共享层次

#### 2.1 前端资源共享（packages/common）

**设计原则：**

- **接口抽象**：定义统一的 API 接口，各平台实现具体调用
- **组件复用**：共享 UI 组件，通过 props 适配不同平台
- **状态管理**：使用 Zustand 实现跨平台状态管理
- **类型安全**：TypeScript 类型定义确保类型一致性

**核心模块：**

##### API 接口层 (`src/api/`)

定义统一的接口契约，不包含具体实现：

```typescript
// DeviceApi - 设备发现相关接口
export interface DeviceApi {
  startDiscovery(port: number): Promise<void>;
  stopDiscovery(): Promise<void>;
  getDeviceId(): Promise<string>;
  getLocalIp(): Promise<string>;
  getDevices(): Promise<DeviceInfo[]>;
  addDevice(device: DeviceInfo): Promise<void>;
  testConnection(targetAddress: string, targetPort: number): Promise<string>;
}

// FileApi - 文件传输相关接口
export interface FileApi {
  selectFile(): Promise<string | null>;
  getFileName(filePath: string): Promise<string>;
  getFileSize(filePath: string): Promise<number>;
  sendFile(
    filePath: string,
    targetAddress: string,
    targetPort: number
  ): Promise<string>;
  saveReceivedFile(filePath: string, fileName: string): Promise<string>;
}
```

**实现方式：**

- 桌面端：通过 Tauri `invoke` 调用 Rust 后端命令
- 移动端：通过 Tauri `invoke` 调用 Rust 后端命令（支持 Android 特殊处理）

##### React Hooks (`src/hooks/`)

提供平台无关的业务逻辑封装：

- **`useDiscovery`**：设备发现 Hook
  - 接受 `DeviceApi` 作为参数
  - 封装启动/停止服务、设备列表管理、防抖逻辑
  - 返回设备列表、服务状态、操作方法

- **`useFileTransfer`**：文件传输 Hook
  - 接受 `FileApi` 作为参数
  - 封装文件选择、发送、接收逻辑
  - 支持移动端自定义文件选择器（Android content URI）

**使用示例：**

```typescript
// 桌面端实现
import { useDiscovery } from "stationuli-common";
import { deviceApi } from "./api/deviceApi";

function App() {
  const discovery = useDiscovery({
    deviceApi: deviceApi,
    defaultPort: 8080,
  });

  // 使用 discovery.devices, discovery.startDiscovery() 等
}

// 移动端实现（相同代码）
import { useDiscovery } from "stationuli-common";
import { deviceApi } from "./api/deviceApi";

function App() {
  const discovery = useDiscovery({
    deviceApi: deviceApi,
    defaultPort: 8080,
  });

  // 相同的 API，但 deviceApi 内部实现不同
}
```

##### UI 组件 (`src/components/`)

共享的 React 组件，通过 props 适配不同平台：

- **`ServiceStatusCard`**：服务状态卡片
  - 显示设备 ID、IP 地址
  - 启动/停止服务按钮
  - 支持复制 IP 和设备 ID
  - 支持加载状态显示

- **`DeviceList`**：设备列表组件
  - 显示发现的设备
  - 支持设备选择
  - 适配桌面端和移动端 UI

- **`AddDeviceDialog`**：手动添加设备对话框
  - 支持输入设备名称、类型、ID、地址、端口
  - 统一的表单验证

- **`FileSelectionCard`**：文件选择卡片
  - 显示选中的文件信息
  - 支持清除选择

- **`ReceivedFilesCard`**：接收文件列表
  - 显示接收到的文件
  - 支持保存文件
  - 桌面端支持打开文件位置（可选）

- **`TransferProgress`**：传输进度组件
  - 显示文件传输进度
  - 支持取消操作

##### 状态管理 (`src/stores/`)

使用 Zustand 实现轻量级状态管理：

- **`deviceStore`**：设备状态管理
  - 设备列表
  - 选中设备
  - 设备 CRUD 操作

- **`transferStore`**：传输状态管理
  - 传输任务列表
  - 传输进度跟踪
  - 传输状态更新

##### 类型定义 (`src/types/`)

统一的 TypeScript 类型定义：

```typescript
// 设备信息
export interface DeviceInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  device_type: string; // "desktop" | "mobile"
}

// 接收的文件
export interface ReceivedFile {
  name: string;
  path: string;
}

// 传输状态
export enum TransferStatus {
  Pending = "pending",
  Transferring = "transferring",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
}
```

#### 2.2 后端资源共享（packages/core）

**设计原则：**

- **Rust 核心库**：实现跨平台的网络通信、文件传输逻辑
- **平台适配**：通过 Tauri 插件处理平台特定功能
- **统一协议**：使用 TCP + 自定义协议进行设备通信

**核心模块：**

- **`p2p/mdns.rs`**：mDNS 设备发现
  - 支持桌面端和移动端
  - 设备注册和发现
  - 设备信息管理

- **`p2p/tcp.rs`**：TCP 连接管理
  - 连接建立
  - 数据传输
  - 连接池管理

- **`file/transfer.rs`**：文件传输
  - 文件分片
  - 分片传输
  - 进度跟踪
  - 错误处理

### 3. 平台适配策略

#### 3.1 API 实现层

各平台在应用层实现 `DeviceApi` 和 `FileApi`：

**桌面端 (`apps/desktop/src/api/`)**：

```typescript
import { invoke } from "@tauri-apps/api/core";

export const deviceApi: DeviceApi = {
  startDiscovery: (port: number) => invoke("start_discovery", { port }),
  // ... 其他方法
};

export const fileApi: FileApi = {
  selectFile: () => invoke("select_file"),
  // ... 其他方法
};
```

**移动端 (`apps/mobile/src/api/`)**：

```typescript
import { invoke } from "@tauri-apps/api/core";

export const deviceApi: DeviceApi = {
  startDiscovery: (port: number) => invoke("start_discovery", { port }),
  // ... 其他方法
};

export const fileApi: FileApi = {
  selectFile: async () => {
    // Android 特殊处理：使用 content URI
    try {
      const result = await invoke("select_file_android");
      return result?.uri || null;
    } catch {
      return await invoke("select_file");
    }
  },
  // ... 其他方法
};
```

#### 3.2 平台特定功能处理

**文件系统访问：**

- **桌面端**：直接文件路径访问
- **移动端（Android）**：使用 `content://` URI，通过 Tauri Android FS 插件处理

**文件保存位置：**

- **桌面端**：`app_data_dir/received_files`
- **移动端**：`app_data_dir/received_files`（通过 Tauri 路径 API 获取）

**UI 适配：**

- 组件通过 props 接收平台特定的回调函数
- 使用条件渲染处理平台差异（如桌面端的"打开位置"按钮）

### 4. 依赖管理

#### 4.1 包依赖关系

```
apps/desktop
  └── stationuli-common (workspace:*)
      └── zustand
      └── react (peer)

apps/mobile
  └── stationuli-common (workspace:*)
      └── zustand
      └── react (peer)

packages/common
  └── zustand
  └── react (peer)
```

#### 4.2 Workspace 配置

使用 pnpm workspace 管理依赖：

```json
// package.json (根目录)
{
  "name": "@stationuli/monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

### 5. 构建和打包

#### 5.1 开发环境

```bash
# 安装所有依赖
pnpm install

# 开发桌面端
pnpm dev:desktop

# 开发移动端
pnpm dev:mobile
```

#### 5.2 构建

```bash
# 构建桌面端
pnpm build:desktop

# 构建移动端
pnpm build:mobile
```

**构建流程：**

1. TypeScript 编译 `packages/common` 到 `dist/`
2. 各应用引用编译后的 `dist/` 文件
3. Tauri 构建各平台应用

### 6. 优势与挑战

#### 6.1 优势

1. **代码复用率高**：UI 组件、业务逻辑、类型定义完全共享
2. **维护成本低**：修复 bug 或添加功能只需修改一处
3. **类型安全**：TypeScript 确保类型一致性
4. **架构清晰**：接口与实现分离，易于测试和扩展

#### 6.2 挑战与解决方案

1. **平台差异处理**
   - **挑战**：文件系统访问、UI 交互方式不同
   - **解决**：通过接口抽象和条件渲染处理

2. **依赖管理**
   - **挑战**：确保各平台依赖版本一致
   - **解决**：使用 workspace 和 peer dependencies

3. **构建复杂度**
   - **挑战**：需要构建共享包后再构建应用
   - **解决**：使用 pnpm workspace 自动处理依赖关系

### 7. 最佳实践

1. **接口优先**：先定义接口，再实现具体功能
2. **平台无关**：共享代码中避免使用平台特定 API
3. **类型严格**：充分利用 TypeScript 类型系统
4. **组件复用**：优先使用共享组件，必要时通过 props 适配
5. **测试覆盖**：为共享代码编写单元测试

### 8. 未来扩展

1. **更多平台支持**：iOS、Web 等
2. **插件系统**：支持第三方扩展
3. **主题系统**：统一的主题和样式管理
4. **国际化**：共享的 i18n 资源

## 总结

通过 `packages/common` 包，Stationuli 实现了桌面端和移动端之间的高效资源共享，在保持代码质量的同时，显著降低了开发和维护成本。这种架构设计为未来的平台扩展和功能增强奠定了坚实的基础。
