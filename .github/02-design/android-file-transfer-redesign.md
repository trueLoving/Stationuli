# Android 文件选择和发送方案重新设计

## 📋 问题分析

### 当前实现的问题

1. **权限问题**
   - 持久化 URI 权限获取可能失败
   - 某些文件提供者不支持持久化权限
   - URI 权限可能在应用暂停后失效
   - 权限丢失导致无法读取文件

2. **大文件处理问题**
   - 当前实现将整个文件加载到内存（`read_to_end`）
   - 大文件会导致内存溢出（OOM）
   - 无法处理超大文件（如视频文件）

3. **文件类型限制**
   - 某些特殊文件可能无法正确获取权限
   - 文件名和元数据获取可能失败

4. **错误处理不足**
   - 权限错误提示不够友好
   - 缺少重试机制
   - 没有降级方案

## 🎯 设计目标

1. ✅ **支持任意文件类型**：所有文件类型都能选择和发送
2. ✅ **支持任意文件大小**：通过流式传输处理大文件
3. ✅ **可靠的权限管理**：多重权限获取策略
4. ✅ **内存友好**：流式读取，避免内存溢出
5. ✅ **用户体验优化**：清晰的错误提示和进度显示

## 🏗️ 新方案架构

### 整体流程

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (React/TypeScript)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. 用户点击"发送文件"                                  │  │
│  │  2. 调用 selectFileAndroid()                          │  │
│  │  3. 显示文件选择器                                      │  │
│  │  4. 获取选中的文件 URI 和元数据                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Tauri Command
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  后端 (Rust/Tauri)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. 验证 URI 权限                                      │  │
│  │  2. 获取文件元数据（大小、名称、MIME 类型）            │  │
│  │  3. 建立 TCP 连接                                      │  │
│  │  4. 发送文件元数据                                    │  │
│  │  5. 流式读取文件并分块发送                            │  │
│  │  6. 发送进度更新                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 技术实现方案

### 1. 文件选择层（前端 + 后端）

#### 1.1 改进的文件选择 API

```rust
/// 选择文件（Android）- 增强版
#[tauri::command]
pub async fn select_file_android_v2(
  app: AppHandle,
  options: FileSelectOptions,
) -> Result<Option<Vec<FileInfo>>, String> {
  // 选项包括：
  // - multiple: 是否多选
  // - mime_types: 文件类型过滤（可选，默认所有类型）
  // - max_size: 最大文件大小限制（可选）
}
```

#### 1.2 文件信息结构

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
  /// Content URI
  pub uri: String,
  /// 文件名（包含扩展名）
  pub name: String,
  /// 文件大小（字节）
  pub size: u64,
  /// MIME 类型
  pub mime_type: Option<String>,
  /// 文件扩展名
  pub extension: Option<String>,
  /// 权限状态
  pub permission_status: PermissionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PermissionStatus {
  /// 已获取持久化权限
  Persistable,
  /// 仅临时权限（需要重新获取）
  Temporary,
  /// 权限未知
  Unknown,
}
```

### 2. 权限管理策略

#### 2.1 多重权限获取策略

```rust
/// 权限获取策略（按优先级）
enum PermissionStrategy {
  /// 1. 尝试获取持久化权限（最佳）
  TryPersistable,
  /// 2. 如果失败，尝试获取临时权限
  FallbackToTemporary,
  /// 3. 如果都失败，在读取时重新请求
  RequestOnRead,
}
```

#### 2.2 权限验证和刷新

```rust
/// 验证并刷新 URI 权限
async fn ensure_uri_permission(
  api: &AndroidFsAsync,
  file_uri: &FileUri,
) -> Result<(), PermissionError> {
  // 1. 检查是否已有持久化权限
  if has_persistable_permission(api, file_uri).await {
    return Ok(());
  }

  // 2. 尝试获取持久化权限
  if let Ok(_) = api.take_persistable_uri_permission(file_uri).await {
    return Ok(());
  }

  // 3. 尝试打开文件验证临时权限
  if can_read_file(api, file_uri).await {
    return Ok(());
  }

  // 4. 如果都失败，返回错误（需要用户重新选择）
  Err(PermissionError::PermissionLost)
}
```

### 3. 流式文件传输

#### 3.1 流式读取接口

```rust
/// 流式读取文件（避免内存溢出）
struct FileStream {
  file_uri: FileUri,
  api: AndroidFsAsync,
  buffer: Vec<u8>,
  buffer_size: usize, // 默认 1MB
}

impl FileStream {
  /// 创建文件流
  async fn new(
    api: AndroidFsAsync,
    file_uri: FileUri,
  ) -> Result<Self, String> {
    // 验证权限
    ensure_uri_permission(&api, &file_uri).await?;

    Ok(Self {
      file_uri,
      api,
      buffer: Vec::with_capacity(1024 * 1024), // 1MB buffer
      buffer_size: 1024 * 1024,
    })
  }

  /// 读取下一个块
  async fn read_chunk(&mut self) -> Result<Option<Vec<u8>>, String> {
    // 使用流式读取，每次读取一个块
    // 避免将整个文件加载到内存
  }
}
```

#### 3.2 改进的发送文件 API

```rust
/// 发送文件（流式传输版本）
#[tauri::command]
pub async fn send_file_streaming(
  file_info: FileInfo,
  target_address: String,
  target_port: u16,
  app: AppHandle,
) -> Result<String, String> {
  // 1. 验证权限
  ensure_uri_permission(&api, &file_uri).await?;

  // 2. 建立 TCP 连接
  let mut connection = TcpConnection::connect(&target_address, target_port)
    .await?;

  // 3. 发送文件元数据
  send_file_metadata(&mut connection, &file_info).await?;

  // 4. 创建文件流
  let mut file_stream = FileStream::new(api, file_uri).await?;

  // 5. 流式读取并发送
  let mut sent_bytes = 0u64;
  let total_size = file_info.size;

  loop {
    // 读取一个块
    match file_stream.read_chunk().await? {
      Some(chunk) => {
        // 发送块
        send_chunk(&mut connection, chunk).await?;

        sent_bytes += chunk.len() as u64;

        // 更新进度
        update_progress(&app, sent_bytes, total_size).await;
      }
      None => break, // 文件读取完成
    }
  }

  // 6. 发送完成消息
  send_complete(&mut connection).await?;

  Ok("File sent successfully".to_string())
}
```

### 4. 错误处理和重试机制

#### 4.1 错误类型定义

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileTransferError {
  /// 权限错误
  PermissionDenied {
    reason: String,
    suggestion: String,
  },
  /// 文件读取错误
  FileReadError {
    reason: String,
    retryable: bool,
  },
  /// 网络错误
  NetworkError {
    reason: String,
    retryable: bool,
  },
  /// 文件大小超限
  FileTooLarge {
    size: u64,
    max_size: u64,
  },
}
```

#### 4.2 重试机制

```rust
/// 带重试的文件发送
async fn send_file_with_retry(
  file_info: FileInfo,
  target_address: String,
  target_port: u16,
  max_retries: u32,
  app: AppHandle,
) -> Result<String, String> {
  let mut last_error = None;

  for attempt in 0..=max_retries {
    match send_file_streaming(
      file_info.clone(),
      target_address.clone(),
      target_port,
      app.clone(),
    ).await {
      Ok(result) => return Ok(result),
      Err(e) => {
        last_error = Some(e.clone());

        // 检查是否可重试
        if !is_retryable(&e) || attempt >= max_retries {
          break;
        }

        // 等待后重试
        tokio::time::sleep(Duration::from_secs(1 << attempt)).await;
      }
    }
  }

  Err(format!("Failed after {} attempts: {:?}", max_retries, last_error))
}
```

### 5. 前端改进

#### 5.1 文件选择组件

```typescript
interface FileSelectOptions {
  multiple?: boolean;
  mimeTypes?: string[]; // 例如: ['image/*', 'video/*', 'application/pdf']
  maxSize?: number; // 字节
}

interface FileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
  extension?: string;
  permissionStatus: "persistable" | "temporary" | "unknown";
}

async function selectFileAndroidV2(
  options: FileSelectOptions = {}
): Promise<FileInfo[] | null> {
  const result = await invoke<FileInfo[] | null>("select_file_android_v2", {
    options,
  });
  return result;
}
```

#### 5.2 文件发送 Hook

```typescript
function useFileTransferV2() {
  const [transferring, setTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sendFile = async (
    fileInfo: FileInfo,
    targetAddress: string,
    targetPort: number
  ) => {
    try {
      setTransferring(true);
      setError(null);

      // 检查权限状态
      if (fileInfo.permissionStatus === "unknown") {
        // 提示用户可能需要重新选择文件
        const confirmed = await confirm(
          "文件权限可能已失效，是否重新选择文件？"
        );
        if (confirmed) {
          // 重新选择文件
          return;
        }
      }

      // 发送文件（带进度监听）
      await invoke("send_file_streaming", {
        fileInfo,
        targetAddress,
        targetPort,
      });

      // 监听进度事件
      const unlisten = await listen("transfer-progress", (event) => {
        const data = event.payload as {
          sent: number;
          total: number;
          progress: number;
        };
        setProgress(data.progress);
      });

      // 等待传输完成
      await listen("transfer-complete", () => {
        unlisten();
        setTransferring(false);
        setProgress(100);
      });
    } catch (err) {
      setError(formatError(err));
      setTransferring(false);
    }
  };

  return { sendFile, transferring, progress, error };
}
```

## 📊 数据流程

### 文件选择流程

```
用户点击"选择文件"
    ↓
调用 select_file_android_v2()
    ↓
显示 Android 文件选择器
    ↓
用户选择文件
    ↓
获取文件 URI
    ↓
尝试获取持久化权限
    ↓
获取文件元数据（大小、名称、MIME 类型）
    ↓
返回 FileInfo[] 给前端
    ↓
前端显示文件信息
```

### 文件发送流程

```
用户点击"发送文件"
    ↓
验证文件权限（如果失效，提示重新选择）
    ↓
建立 TCP 连接
    ↓
发送文件元数据（文件名、大小、MIME 类型）
    ↓
创建文件流（FileStream）
    ↓
循环：
  ├─ 读取文件块（1MB）
  ├─ 发送文件块
  ├─ 更新进度
  └─ 继续直到文件结束
    ↓
发送完成消息
    ↓
关闭连接
    ↓
通知前端传输完成
```

## 🔐 权限管理详细设计

### 权限获取时机

1. **文件选择时**：立即尝试获取持久化权限
2. **发送前验证**：检查权限是否仍然有效
3. **读取时验证**：如果权限失效，尝试重新获取

### 权限状态管理

```rust
/// 权限状态缓存
struct PermissionCache {
  uri: String,
  status: PermissionStatus,
  last_checked: SystemTime,
}

/// 检查权限状态
async fn check_permission_status(
  api: &AndroidFsAsync,
  file_uri: &FileUri,
) -> PermissionStatus {
  // 1. 检查持久化权限
  if has_persistable_permission(api, file_uri).await {
    return PermissionStatus::Persistable;
  }

  // 2. 尝试打开文件检查临时权限
  if can_read_file(api, file_uri).await {
    return PermissionStatus::Temporary;
  }

  // 3. 权限已失效
  PermissionStatus::Unknown
}
```

## 💾 内存管理

### 流式读取实现

```rust
impl FileStream {
  async fn read_chunk(&mut self) -> Result<Option<Vec<u8>>, String> {
    // 使用固定大小的缓冲区
    let mut buffer = vec![0u8; self.buffer_size];

    // 打开文件（每次读取时打开，避免长时间持有文件句柄）
    let mut file = self.api
      .open_file_readable(&self.file_uri)
      .await
      .map_err(|e| format!("Failed to open file: {}", e))?;

    // 读取一个块
    match file.read(&mut buffer).await {
      Ok(0) => Ok(None), // EOF
      Ok(n) => {
        buffer.truncate(n);
        Ok(Some(buffer))
      }
      Err(e) => Err(format!("Read error: {}", e)),
    }
  }
}
```

### 内存使用估算

- **缓冲区大小**：1MB（可配置）
- **最大内存占用**：约 2-3MB（缓冲区 + 网络发送缓冲区）
- **支持的文件大小**：理论上无限制（实际受磁盘空间限制）

## 🎨 用户体验优化

### 1. 文件选择体验

- **文件预览**：显示文件图标、名称、大小
- **多选支持**：支持一次选择多个文件
- **文件类型过滤**：可选的 MIME 类型过滤
- **大小限制提示**：如果文件过大，提前提示

### 2. 传输进度显示

- **实时进度**：显示传输百分比和速度
- **剩余时间估算**：基于当前速度估算剩余时间
- **错误提示**：友好的错误信息和解决建议

### 3. 错误处理

```typescript
function formatError(error: any): string {
  if (error.includes("Permission")) {
    return "文件权限已失效，请重新选择文件";
  }
  if (error.includes("Network")) {
    return "网络连接失败，请检查网络设置";
  }
  if (error.includes("File too large")) {
    return "文件过大，请选择较小的文件";
  }
  return `传输失败：${error}`;
}
```

## 📝 实现步骤

### Phase 1: 基础功能

1. ✅ 实现新的文件选择 API（`select_file_android_v2`）
2. ✅ 实现 `FileInfo` 结构
3. ✅ 实现权限状态检查

### Phase 2: 流式传输

1. ✅ 实现 `FileStream` 结构
2. ✅ 实现流式读取
3. ✅ 实现 `send_file_streaming` API

### Phase 3: 错误处理

1. ✅ 实现错误类型定义
2. ✅ 实现重试机制
3. ✅ 实现友好的错误提示

### Phase 4: 前端集成

1. ✅ 更新文件选择组件
2. ✅ 更新文件发送 Hook
3. ✅ 更新 UI 显示

### Phase 5: 测试和优化

1. ✅ 测试各种文件类型
2. ✅ 测试大文件传输
3. ✅ 测试权限失效场景
4. ✅ 性能优化

## 🔄 迁移计划

### 向后兼容

- 保留旧的 API（`select_file_android`、`send_file`）
- 新 API 作为增强版本
- 逐步迁移到新 API

### 版本控制

```rust
// 旧版本（保留）
#[tauri::command]
pub async fn select_file_android(...) -> ... { ... }

// 新版本
#[tauri::command]
pub async fn select_file_android_v2(...) -> ... { ... }
```

## 📚 参考资料

- [Android Storage Access Framework](https://developer.android.com/guide/topics/providers/document-provider)
- [Tauri Android FS Plugin](https://github.com/tauri-apps/plugins-workspace/tree/dev/plugins/android-fs)
- [Android Scoped Storage](https://developer.android.com/training/data-storage)

## ✅ 检查清单

- [ ] 实现新的文件选择 API
- [ ] 实现流式文件读取
- [ ] 实现权限管理策略
- [ ] 实现错误处理和重试
- [ ] 更新前端组件
- [ ] 测试各种文件类型
- [ ] 测试大文件传输
- [ ] 性能测试和优化
- [ ] 文档更新

---

**设计者**: @trueLoving  
**日期**: 2024-12-14  
**版本**: 1.0
