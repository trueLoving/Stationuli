# 贡献指南

感谢您对 Stationuli 项目的关注！本文档提供了参与项目贡献的指南和说明。

## 目录

- [行为准则](#行为准则)
- [开始之前](#开始之前)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [编码规范](#编码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [测试](#测试)
- [文档](#文档)
- [问题与支持](#问题与支持)

## 行为准则

本项目遵循行为准则，所有贡献者都应遵守。请在所有互动中保持尊重、包容和建设性。

## 开始之前

### 前置要求

在开始之前，请确保已安装以下工具：

- **Node.js**: v20 或更高版本
- **pnpm**: v10.18.3（必需的包管理器）
- **Rust**: 最新稳定版本（2024 版本）
  ```bash
  cargo install tauri-cli
  ```

### 平台特定要求

#### 桌面端开发

- **Windows**: Visual Studio Build Tools 或带 C++ 工作负载的 Visual Studio
- **macOS**: Xcode Command Line Tools
- **Linux**: `libwebkit2gtk-4.0-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`

#### 移动端开发（Android）

- **Android Studio**: 最新版本
- **Android SDK**: API 28+ (Android 9.0+)
- **Java**: JDK 17
- **Android NDK**: 版本 25.1.8937393 或兼容版本

## 开发环境设置

### 1. Fork 和克隆

```bash
# 在 GitHub 上 Fork 仓库，然后克隆您的 Fork
git clone https://github.com/YOUR_USERNAME/Stationuli.git
cd Stationuli
```

### 2. 安装依赖

```bash
# 安装所有依赖（前端和后端）
pnpm install
```

### 3. 验证安装

```bash
# 检查代码格式化
pnpm format:check
pnpm format:rust:check

# 运行代码检查
pnpm lint
```

## 项目结构

```
Stationuli/
├── apps/
│   ├── desktop/          # 桌面端应用 (Tauri + React)
│   └── mobile/           # 移动端应用 (Tauri + React)
├── packages/
│   ├── common/           # 共享资源 (TypeScript/React)
│   │   ├── src/
│   │   │   ├── api/      # API 接口定义
│   │   │   ├── components/  # 共享 UI 组件
│   │   │   ├── hooks/   # 共享 React Hooks
│   │   │   ├── stores/   # 共享状态管理
│   │   │   ├── types/   # 共享 TypeScript 类型
│   │   │   └── utils/   # 共享工具函数
│   │   └── package.json
│   └── core/             # 核心库 (Rust)
│       └── src/
│           ├── p2p/      # P2P 网络 (mDNS, TCP)
│           ├── file/     # 文件传输
│           └── crypto/   # 加密功能
├── .github/
│   ├── workflows/        # GitHub Actions 工作流
│   └── design/          # 设计文档
└── package.json         # 根 package.json
```

更多详情，请参阅[设计文档](.github/design/README.md)。

## 开发工作流

### 运行开发服务器

```bash
# 桌面端开发
pnpm dev:desktop

# 移动端开发 (Android)
pnpm dev:mobile
```

### 构建应用

```bash
# 构建桌面端应用
pnpm build:desktop

# 构建移动端应用 (APK)
pnpm build:mobile
```

### 使用共享包

`packages/common` 包包含桌面端和移动端共享的代码：

- **API 接口**: 定义 `DeviceApi` 和 `FileApi` 接口
- **React Hooks**: `useDiscovery`, `useFileTransfer`
- **UI 组件**: 可复用组件如 `ServiceStatusCard`, `DeviceList`
- **状态管理**: 设备和传输的 Zustand stores
- **类型定义**: 共享的 TypeScript 类型

修改共享代码时，请确保在两个平台上都能正常工作。

## 编码规范

### TypeScript/React

- **格式化**: 使用 Prettier（配置在 `.prettierrc`）
- **代码检查**: 遵循 ESLint 规则
- **类型安全**: 严格使用 TypeScript，避免使用 `any`
- **组件结构**: 使用函数式组件和 Hooks
- **命名规范**:
  - 组件: PascalCase (`ServiceStatusCard`)
  - Hooks: camelCase，以 `use` 开头 (`useDiscovery`)
  - 函数: camelCase
  - 常量: UPPER_SNAKE_CASE

### Rust

- **格式化**: 使用 `rustfmt`（配置在 `rustfmt.toml`）
- **代码检查**: 使用 `clippy` 进行额外检查
- **错误处理**: 使用 `Result<T, E>` 进行错误处理
- **异步**: 使用 `tokio` 进行异步操作
- **命名**: 遵循 Rust 命名约定（snake_case）

### 代码风格示例

**TypeScript:**

```typescript
// 好的示例
export function useDiscovery({ deviceApi, defaultPort }: UseDiscoveryOptions) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  // ...
}

// 不好的示例
export function useDiscovery(options: any) {
  const [devices, setDevices] = useState([]);
  // ...
}
```

**Rust:**

```rust
// 好的示例
pub async fn start_discovery(
    port: u16,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // ...
}

// 不好的示例
pub async fn start_discovery(port: u16, state: State) -> String {
    // ...
}
```

## 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更改
- `style`: 代码风格更改（格式化、缺少分号等）
- `refactor`: 代码重构
- `perf`: 性能改进
- `test`: 添加或更新测试
- `chore`: 维护任务
- `ci`: CI/CD 更改

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```
feat(desktop): 添加深色模式切换

为桌面端应用实现深色模式支持，包含系统偏好检测。

Closes #123
```

```
fix(mobile): 修复 Android 文件权限问题

通过添加持久化 URI 权限请求修复 Android 上的 content URI 权限处理。

Fixes #456
```

```
docs(common): 更新 API 文档

为 DeviceApi 和 FileApi 接口添加示例。
```

### Pre-commit Hooks

项目使用 Husky 和 lint-staged 自动：

- 使用 Prettier 格式化代码（TypeScript/JavaScript/JSON/Markdown）
- 使用 rustfmt 格式化代码（Rust）

提交前请确保代码已正确格式化。

## Pull Request 流程

### 提交前检查

1. **更新文档**: 如需要，更新相关文档
2. **添加测试**: 为新功能或 bug 修复添加测试
3. **检查格式化**: 运行 `pnpm format` 和 `pnpm format:rust`
4. **运行检查**: 运行 `pnpm lint`
5. **测试更改**: 如适用，在桌面端和移动端测试

### PR 检查清单

- [ ] 代码遵循项目风格指南
- [ ] 已完成自我审查
- [ ] 为复杂代码添加了注释
- [ ] 已更新文档
- [ ] 没有产生新警告
- [ ] 已添加/更新测试（如适用）
- [ ] 所有测试通过
- [ ] 已在目标平台测试更改

### PR 描述模板

```markdown
## 描述

简要描述更改内容

## 更改类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新

## 测试

如何测试此更改？

## 截图（如适用）

为 UI 更改添加截图

## 相关问题

Closes #123
```

### 审查流程

1. 维护者将审查您的 PR
2. 处理任何反馈或请求的更改
3. 一旦获得批准，您的 PR 将被合并

## 测试

### 手动测试

- **桌面端**: 在 Windows 和 macOS 上测试
- **移动端**: 在 Android 设备上测试（API 28+）
- **跨平台**: 测试桌面端和移动端之间的文件传输

### 自动化测试

```bash
# 运行测试（当可用时）
pnpm test

# 运行 Rust 测试
cargo test
```

## 文档

### 代码文档

- **TypeScript**: 为函数和类使用 JSDoc 注释
- **Rust**: 为公共 API 使用文档注释（`///`）

### 示例

```typescript
/**
 * 设备发现 Hook
 * @param options - 发现选项，包括设备 API 和默认端口
 * @returns 发现状态和方法
 */
export function useDiscovery(options: UseDiscoveryOptions) {
  // ...
}
```

```rust
/// 启动设备发现服务
///
/// # 参数
/// * `port` - 服务端口号
/// * `state` - 应用状态
///
/// # 返回
/// 包含成功消息或错误的 Result
pub async fn start_discovery(
    port: u16,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // ...
}
```

### 设计文档

设计文档位于 `.github/design/`。进行重大架构更改时，请更新相关设计文档。

## 问题与支持

- **GitHub Issues**: 用于 bug 报告和功能请求
- **Discussions**: 用于问题和一般讨论
- **文档**: 查看[设计文档](.github/design/README.md)了解架构详情

## 许可证

通过贡献，您同意您的贡献将在与项目相同的许可证（BSL 1.1）下授权。

---

感谢您为 Stationuli 做出贡献！🚀
