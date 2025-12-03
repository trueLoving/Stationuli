# Stationuli 设计文档

本目录包含 Stationuli 项目的核心设计文档。

## 整体架构设计

### 1. 项目整体架构

```mermaid
graph TB
    subgraph "Stationuli Monorepo"
        subgraph "Applications"
            Desktop[桌面端应用<br/>apps/desktop<br/>Tauri + React]
            Mobile[移动端应用<br/>apps/mobile<br/>Tauri + React]
        end

        subgraph "Shared Packages"
            Common[共享资源包<br/>packages/common<br/>TypeScript/React]
            Core[核心库<br/>packages/core<br/>Rust]
        end

        Desktop -->|依赖| Common
        Desktop -->|依赖| Core
        Mobile -->|依赖| Common
        Mobile -->|依赖| Core
        Common -.->|类型定义| Core
    end

    subgraph "Platforms"
        Win[Windows]
        Mac[macOS]
        Android[Android]
    end

    Desktop --> Win
    Desktop --> Mac
    Mobile --> Android
```

### 2. 跨平台资源共享架构

```mermaid
graph LR
    subgraph "packages/common"
        API[API 接口定义<br/>DeviceApi / FileApi]
        Hooks[React Hooks<br/>useDiscovery / useFileTransfer]
        Components[UI 组件<br/>ServiceStatusCard / DeviceList]
        Stores[状态管理<br/>Zustand Stores]
        Types[类型定义<br/>TypeScript Types]
        Utils[工具函数<br/>格式化 / 验证]
    end

    subgraph "apps/desktop"
        DApp[Desktop App<br/>React]
        DAPI[Desktop API<br/>Tauri Invoke]
        DBackend[Desktop Backend<br/>Rust/Tauri]
    end

    subgraph "apps/mobile"
        MApp[Mobile App<br/>React]
        MAPI[Mobile API<br/>Tauri Invoke]
        MBackend[Mobile Backend<br/>Rust/Tauri]
    end

    DApp -->|使用| Hooks
    DApp -->|使用| Components
    DApp -->|使用| Stores
    DApp -->|使用| Types
    DApp -->|使用| Utils
    DAPI -.->|实现| API
    DBackend -->|调用| DAPI

    MApp -->|使用| Hooks
    MApp -->|使用| Components
    MApp -->|使用| Stores
    MApp -->|使用| Types
    MApp -->|使用| Utils
    MAPI -.->|实现| API
    MBackend -->|调用| MAPI

    Hooks -.->|依赖| API
    Components -.->|依赖| Types
    Stores -.->|依赖| Types
```

### 3. 设备发现和文件传输架构

```mermaid
sequenceDiagram
    participant D as 桌面端
    participant M as 移动端
    participant MDNS as mDNS 服务
    participant TCP as TCP 连接

    Note over D,M: 设备发现阶段
    D->>MDNS: 注册服务 (端口 8080)
    M->>MDNS: 注册服务 (端口 8080)
    MDNS->>D: 广播设备信息
    MDNS->>M: 广播设备信息
    D->>D: 更新设备列表
    M->>M: 更新设备列表

    Note over D,M: 文件传输阶段
    D->>M: 选择目标设备
    D->>TCP: 建立 TCP 连接 (M的IP:8080)
    TCP->>M: 接收连接请求
    M->>TCP: 接受连接
    D->>TCP: 发送 StartTransfer 消息
    D->>TCP: 发送文件分片 (Chunk 1..N)
    TCP->>M: 接收文件分片
    M->>M: 重组文件
    D->>TCP: 发送 Complete 消息
    TCP->>M: 文件传输完成
    M->>M: 保存文件到 received_files/
    M->>M: 发送 file-received 事件
```

### 4. 技术栈架构

```mermaid
graph TB
    subgraph "前端层"
        React[React 19<br/>UI 框架]
        TS[TypeScript<br/>类型系统]
        Tailwind[Tailwind CSS<br/>样式框架]
        Zustand[Zustand<br/>状态管理]
    end

    subgraph "应用层"
        DesktopApp[Desktop App<br/>Tauri 2.0]
        MobileApp[Mobile App<br/>Tauri 2.0]
    end

    subgraph "后端层"
        Rust[Rust 2024<br/>系统编程]
        Tokio[Tokio<br/>异步运行时]
        Tauri[Tauri Core<br/>应用框架]
    end

    subgraph "核心库"
        MDNS[mDNS Discovery<br/>设备发现]
        TCP[TCP Connection<br/>网络连接]
        Transfer[File Transfer<br/>文件传输]
    end

    subgraph "平台层"
        WinAPI[Windows API]
        MacAPI[macOS API]
        AndroidAPI[Android API]
    end

    React --> DesktopApp
    React --> MobileApp
    TS --> React
    Tailwind --> React
    Zustand --> React

    DesktopApp --> Tauri
    MobileApp --> Tauri
    Tauri --> Rust
    Rust --> Tokio

    DesktopApp --> MDNS
    DesktopApp --> TCP
    DesktopApp --> Transfer
    MobileApp --> MDNS
    MobileApp --> TCP
    MobileApp --> Transfer

    DesktopApp --> WinAPI
    DesktopApp --> MacAPI
    MobileApp --> AndroidAPI
```

### 5. 数据流架构

```mermaid
flowchart TD
    Start([用户操作]) --> UI[UI 组件]
    UI --> Hook[React Hook]
    Hook --> API[API 接口]
    API --> Invoke[Tauri Invoke]
    Invoke --> Command[Rust Command]
    Command --> Core[Core Library]

    Core --> MDNS[mDNS Discovery]
    Core --> TCP[TCP Connection]
    Core --> Transfer[File Transfer]

    MDNS --> Network[网络层]
    TCP --> Network
    Transfer --> Network

    Network --> Remote[远程设备]

    Remote --> Network
    Network --> Event[Tauri Event]
    Event --> Hook
    Hook --> UI
    UI --> Update([UI 更新])

    style Start fill:#e1f5ff
    style Update fill:#e1f5ff
    style Core fill:#fff4e1
    style Network fill:#ffe1e1
```

## 文档列表

### 1. [跨平台资源共享设计方案](./cross-platform-resource-sharing.md)

详细说明如何通过 `packages/common` 包实现桌面端和移动端之间的资源共享，包括：

- 架构设计
- 资源共享层次（API 接口、React Hooks、UI 组件、状态管理、类型定义）
- 平台适配策略
- 依赖管理
- 构建和打包流程
- 最佳实践

### 2. [设备发现和文件传输设计文档](./device-discovery-and-file-transfer.md)

详细说明设备发现和文件传输的实现机制，包括：

- 整体架构
- mDNS 设备发现原理和实现
- TCP 文件传输协议
- 文件分片和重组
- 平台特定处理（Android content URI）
- 错误处理和性能优化
- 安全考虑

## 相关资源

- **代码仓库**：`packages/common/` - 共享资源包
- **核心库**：`packages/core/` - Rust 核心库
- **桌面端**：`apps/desktop/` - 桌面端应用
- **移动端**：`apps/mobile/` - 移动端应用

## 更新日志

- **2025-12-02**：初始版本，创建跨平台资源共享和设备发现/文件传输设计文档
