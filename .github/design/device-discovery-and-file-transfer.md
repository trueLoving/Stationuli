# 设备发现和文件传输设计文档

## 概述

Stationuli 实现了基于 mDNS 的设备发现和基于 TCP 的文件传输功能，支持桌面端和移动端之间的点对点通信。

## 架构设计

### 1. 整体架构

```
┌─────────────────┐         ┌─────────────────┐
│   桌面端应用     │         │   移动端应用     │
│  (Desktop App)  │         │  (Mobile App)   │
└────────┬────────┘         └────────┬────────┘
         │                            │
         │  Tauri Commands            │  Tauri Commands
         │                            │
┌────────▼────────┐         ┌────────▼────────┐
│  Desktop Backend│         │  Mobile Backend │
│  (Rust/Tauri)   │         │  (Rust/Tauri)   │
└────────┬────────┘         └────────┬────────┘
         │                            │
         └──────────┬─────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Core Library       │
         │  (packages/core)     │
         │                      │
         │  - mDNS Discovery    │
         │  - TCP Connection    │
         │  - File Transfer     │
         └──────────────────────┘
```

### 2. 设备发现（mDNS）

#### 2.1 工作原理

使用 mDNS（Multicast DNS）协议实现局域网内的设备自动发现：

1. **服务注册**：设备启动时注册 mDNS 服务
2. **服务发现**：监听局域网内的 mDNS 广播
3. **设备信息**：通过 mDNS TXT 记录传递设备信息

#### 2.2 实现细节

**核心模块：`packages/core/src/p2p/mdns.rs`**

```rust
pub struct MdnsDiscovery {
    devices: Arc<RwLock<HashMap<String, DeviceInfo>>>,
    port: u16,
    device_id: String,
    device_name: String,
    device_type: String, // "desktop" or "mobile"
    // ...
}

pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub address: String,
    pub port: u16,
    pub device_type: String,
}
```

**设备信息结构：**

- `id`：设备唯一标识（自动生成）
- `name`：设备名称（从系统获取）
- `address`：设备 IP 地址
- `port`：服务端口（默认 8080）
- `device_type`：设备类型（"desktop" 或 "mobile"）

#### 2.3 服务启动流程

**桌面端 (`apps/desktop/src-tauri/src/api/device.rs`)**：

```rust
#[tauri::command]
pub async fn start_discovery(
    port: u16,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<String, String> {
    // 1. 停止旧服务（如果存在）
    if let Some(mut discovery) = state.inner().discovery.write().await.take() {
        discovery.stop().await?;
    }

    // 2. 创建新的发现服务
    let mut discovery = MdnsDiscovery::new(port);
    discovery.set_device_type("desktop".to_string());
    discovery.start().await?;

    // 3. 启动 TCP 监听器
    let listener = TcpConnection::listen(port).await?;
    *state.inner().tcp_listener.write().await = Some(listener);

    // 4. 启动文件接收任务
    start_file_receiver_task(
        state.inner().tcp_listener.clone(),
        state.inner().file_transfer.clone(),
        app.clone(),
    );

    Ok("Service started".to_string())
}
```

**移动端**：流程相同，但 `device_type` 设置为 `"mobile"`

#### 2.4 设备发现 API

**前端接口 (`packages/common/src/api/index.ts`)**：

```typescript
export interface DeviceApi {
  startDiscovery(port: number): Promise<void>;
  stopDiscovery(): Promise<void>;
  getDeviceId(): Promise<string>;
  getLocalIp(): Promise<string>;
  getDevices(): Promise<DeviceInfo[]>;
  addDevice(device: DeviceInfo): Promise<void>;
  testConnection(targetAddress: string, targetPort: number): Promise<string>;
}
```

**使用示例 (`packages/common/src/hooks/useDiscovery.ts`)**：

```typescript
export function useDiscovery({ deviceApi, defaultPort }: UseDiscoveryOptions) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const startDiscovery = useCallback(async () => {
    await deviceApi.startDiscovery(defaultPort);
    setIsDiscovering(true);

    // 获取设备 ID 和本地 IP
    const id = await deviceApi.getDeviceId();
    const ip = await deviceApi.getLocalIp();
    // ...
  }, [deviceApi, defaultPort]);

  // ...
}
```

#### 2.5 手动添加设备

支持手动添加设备（用于测试或网络环境不支持 mDNS）：

```typescript
const addDevice = useCallback(
  async (
    address: string,
    port: number,
    name?: string,
    deviceType?: string,
    deviceId?: string
  ) => {
    const device: DeviceInfo = {
      id: deviceId || `manual-${Date.now()}`,
      name: name || `手动添加的设备 (${address}:${port})`,
      address,
      port,
      device_type: deviceType || "unknown",
    };

    await deviceApi.addDevice(device);
  },
  [deviceApi]
);
```

### 3. 文件传输

#### 3.1 传输协议

使用 TCP + 自定义二进制协议进行文件传输：

```
┌─────────────────────────────────────────┐
│  StartTransfer Message                   │
│  - file_name: String                     │
│  - file_size: u64                        │
│  - total_chunks: u64                     │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Chunk Message (重复 N 次)              │
│  - chunk_id: u64                        │
│  - data: Vec<u8>                        │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Complete Message                       │
└─────────────────────────────────────────┘
```

#### 3.2 文件分片

**分片策略：**

- 默认分片大小：1MB (1024 \* 1024 bytes)
- 大文件自动分片传输
- 每个分片包含分片 ID 和数据

**实现 (`packages/core/src/file/transfer.rs`)**：

```rust
pub struct FileTransfer {
    chunk_size: usize, // 1MB
}

impl FileTransfer {
    pub async fn send_file(
        &self,
        file_path: &str,
        target_address: &str,
        target_port: u16,
    ) -> Result<()> {
        // 1. 读取文件
        let file_data = fs::read(file_path).await?;

        // 2. 分片文件
        let chunks = FileChunk::split_file(&file_data, self.chunk_size, file_name);

        // 3. 建立 TCP 连接
        let mut connection = TcpConnection::connect(target_address, target_port).await?;

        // 4. 发送 StartTransfer 消息
        connection.send_message(&TransferMessage::StartTransfer {
            file_name,
            file_size,
            total_chunks: chunks.len() as u64,
        }).await?;

        // 5. 发送所有分片
        for chunk in chunks {
            connection.send_message(&TransferMessage::Chunk {
                chunk_id: chunk.id,
                data: chunk.data,
            }).await?;
        }

        // 6. 发送 Complete 消息
        connection.send_message(&TransferMessage::Complete).await?;

        Ok(())
    }
}
```

#### 3.3 文件接收

**接收流程：**

1. **TCP 监听器**：持续监听连接请求
2. **接收消息**：解析传输消息
3. **文件重组**：按分片 ID 重组文件
4. **保存文件**：保存到应用数据目录

**实现 (`apps/desktop/src-tauri/src/discovery.rs`)**：

```rust
pub fn start_file_receiver_task(
    listener: Arc<RwLock<Option<TcpListener>>>,
    transfer: Arc<RwLock<FileTransfer>>,
    app: AppHandle,
) {
    tokio::spawn(async move {
        loop {
            if let Some(listener) = listener.read().await.as_ref() {
                let save_dir = app.path().app_data_dir()
                    .unwrap()
                    .join("received_files");

                // 接收文件
                match transfer.read().await
                    .receive_file(save_dir.to_str().unwrap(), listener)
                    .await
                {
                    Ok(file_path) => {
                        // 发送事件通知前端
                        app.emit("file-received", json!({
                            "file_path": file_path,
                            "file_name": file_name
                        })).ok();
                    }
                    Err(e) => {
                        eprintln!("File receive error: {}", e);
                    }
                }
            }
        }
    });
}
```

#### 3.4 平台特定处理

**桌面端：**

- 直接使用文件路径
- 标准文件系统访问

**移动端（Android）：**

- 支持 `content://` URI
- 使用 Tauri Android FS 插件读取文件
- 需要获取持久化 URI 权限

**实现 (`apps/mobile/src-tauri/src/api/file.rs`)**：

```rust
#[tauri::command]
pub async fn select_file_android(
    api: tauri::AppHandle,
) -> Result<Option<FileInfo>, String> {
    use tauri_plugin_android_fs::AndroidFsExt;

    // 1. 打开文件选择器
    let file_uri = api
        .android_fs()
        .open_document()
        .await
        .map_err(|e| format!("Failed to open document: {}", e))?;

    // 2. 获取持久化权限
    api.android_fs()
        .take_persistable_uri_permission(&file_uri)
        .await
        .map_err(|e| format!("Failed to take permission: {}", e))?;

    // 3. 读取文件信息
    // ...
}
```

### 4. 前端集成

#### 4.1 文件传输 Hook

**使用 (`packages/common/src/hooks/useFileTransfer.ts`)**：

```typescript
export function useFileTransfer({
  fileApi,
  onSelectFile,
}: UseFileTransferOptions) {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [transferProgress, setTransferProgress] = useState<number>(0);

  const selectFile = useCallback(async () => {
    // 1. 选择文件（支持平台特定选择器）
    if (onSelectFile) {
      const result = await onSelectFile("");
      if (result) {
        setSelectedFile(result.uri);
        setSelectedFileName(result.name);
      }
    } else {
      const filePath = await fileApi.selectFile();
      if (filePath) {
        setSelectedFile(filePath);
        // 获取文件名和大小
        const name = await fileApi.getFileName(filePath);
        const size = await fileApi.getFileSize(filePath);
        setSelectedFileName(name);
      }
    }
  }, [fileApi, onSelectFile]);

  const sendFile = useCallback(
    async (targetAddress: string, targetPort: number) => {
      if (!selectedFile) {
        alert("请先选择要发送的文件");
        return;
      }

      try {
        setTransferProgress(0);
        await fileApi.sendFile(selectedFile, targetAddress, targetPort);
        alert("✅ 文件发送成功");
      } catch (error) {
        alert(`❌ 文件发送失败: ${error}`);
      }
    },
    [selectedFile, fileApi]
  );

  // ...
}
```

#### 4.2 接收文件处理

**监听文件接收事件：**

```typescript
useEffect(() => {
  const unlisten = listen("file-received", (event) => {
    const { file_path, file_name } = event.payload as {
      file_path: string;
      file_name: string;
    };

    // 添加到接收文件列表
    addReceivedFile({
      name: file_name,
      path: file_path,
    });
  });

  return () => {
    unlisten.then((fn) => fn());
  };
}, []);
```

### 5. 错误处理

#### 5.1 连接错误

- **超时处理**：连接建立超时（默认 5 秒）
- **重试机制**：自动重试失败的连接
- **错误提示**：用户友好的错误消息

#### 5.2 传输错误

- **分片丢失检测**：检查分片完整性
- **断线重连**：支持断点续传（未来功能）
- **错误恢复**：部分失败时清理资源

#### 5.3 服务停止

- **防抖处理**：防止频繁启动/停止
- **超时保护**：停止服务超时（5 秒）
- **资源清理**：确保资源完全释放

### 6. 性能优化

#### 6.1 文件传输

- **分片传输**：大文件分片，避免内存溢出
- **异步处理**：非阻塞 I/O 操作
- **进度跟踪**：实时更新传输进度（未来功能）

#### 6.2 设备发现

- **缓存机制**：缓存已发现的设备
- **定期刷新**：定时刷新设备列表
- **去重处理**：避免重复设备

### 7. 安全考虑

#### 7.1 网络安全

- **局域网限制**：仅在局域网内通信
- **端口验证**：验证目标端口有效性
- **连接验证**：测试连接后再传输

#### 7.2 文件安全

- **路径验证**：验证文件路径合法性
- **大小限制**：限制单文件大小（未来功能）
- **类型检查**：检查文件类型（未来功能）

### 8. 未来改进

1. **断点续传**：支持大文件断点续传
2. **多文件传输**：支持批量文件传输
3. **传输加密**：端到端加密（TLS）
4. **传输压缩**：自动压缩传输数据
5. **进度显示**：实时传输进度和速度
6. **传输队列**：管理多个传输任务
7. **传输历史**：记录传输历史

## 总结

Stationuli 的设备发现和文件传输功能基于成熟的网络协议（mDNS + TCP），实现了桌面端和移动端之间的无缝通信。通过合理的架构设计和平台适配，确保了功能的可靠性和用户体验的一致性。
