# Stationuli —— 个人工作站P2P文件传输与控制解决方案

🔗 **个人工作站应用** - 完全离线、完全私有的P2P文件传输与设备控制，打通PC与Android设备壁垒

## 📖 产品名称

**Stationuli** 由 **Station**（工作站）和 **uli** 后缀组成。

- **Station**：工作站，代表个人设备的连接中心和控制枢纽
- **uli**：产品标识后缀，赋予名称独特性和科技感

**含义**：Stationuli 旨在成为您的个人工作站中心，打通不同设备间的壁垒，实现文件传输与设备控制的统一管理。就像工作站是您的工作中心一样，Stationuli 是您个人设备网络的核心枢纽。

## 💭 项目初衷

Stationuli 的诞生源于三个核心驱动力：

### 1. 项目经历积累 📚

在之前的项目开发中，本人深入探索了不同设备在离线环境下的文件传输技术，特别是 **Android 到 PC 端的传输场景**。这段经历让本人深刻理解了：
- 离线环境下设备发现的挑战（mDNS、蓝牙等）
- 跨平台文件传输的技术难点
- P2P直连的可靠性和性能优化

这些实践经验为 Stationuli 的技术架构奠定了坚实基础。

### 2. 个人真实需求 🏠

作为开发者，本人迫切需要一套软件来**搭建完全属于自己的个人工作站**：
- **设备打通**：将 PC、Mobile、iPad、Watch 等设备相互连接
- **完全私有**：所有信息传输不经过任何第三方服务器
- **离线优先**：支持完全离线环境下工作，保护隐私和数据安全
- **自主控制**：完全掌控自己的数据流向和设备连接

现有的解决方案要么依赖云服务，要么功能单一，无法满足本人对**完全自主、完全离线**的个人工作站需求。因此，本人决定自己打造 Stationuli。

### 3. 技术探索精神 🔬

Stationuli 也是本人**研究不同领域技术生态**的实践平台：
- **Rust 生态**：探索 Rust 在系统编程、网络编程、加密等领域的应用
- **跨平台开发**：研究 Tauri、React Native 等跨平台框架的优劣
- **P2P 网络**：深入理解 QUIC、mDNS、NAT 穿透等网络技术
- **系统集成**：探索 Windows、macOS、Android 等平台的系统 API

通过 Stationuli，本人不仅解决了实际问题，也在不断学习和探索前沿技术。

---

**Stationuli 不仅仅是一个产品，更是本人对技术理想的实践，对隐私保护的坚持，对自主控制的追求。**

## 🎯 产品目标

Stationuli 致力于帮助用户打造**完全自主、完全离线、完全私有**的个人工作站生态：

### 核心目标

1. **打通设备壁垒** 🔗
   - 连接PC和Android设备，构建个人设备网络
   - 实现设备间的无缝互通与协作

2. **打造个人工作站** 🏠
   - 不依赖任何第三方服务，完全自主控制
   - 所有数据仅在您的设备间传输，绝不经过服务器

3. **完全离线工作** 📴
   - 支持局域网内完全离线运行
   - 无需互联网连接，保护隐私和数据安全

4. **零信任架构** 🔐
   - 端到端加密，数据不经过任何中间服务器
   - 设备间直接P2P连接，您完全掌控数据流向

5. **简单高效** ✨
   - **使用简单**：用户只需要将设备连接到同一个局域网或WiFi，然后安装对应软件，启动软件，即可完成设置
   - **零配置**：自动发现周边设备，无需手动输入IP地址或设备ID
   - **一键连接**：设备发现后一键连接，快速开始传输和控制
   - **开箱即用**：安装即用，无需复杂配置，降低使用门槛

## 🌐 产品定位

纯P2P跨平台文件传输与控制工具，支持：

- 🖥️ **PC端**：Windows/macOS原生应用（Tauri）
- 📱 **移动端**：Android原生应用
- 🔄 **全平台互通**：PC与Android间文件传输与设备控制
- 🎮 **设备控制**：Android控制PC（需两端安装原生软件）
- ⚠️ **安装要求**：所有功能均需安装原生软件，不支持Web端
- 🏠 **个人工作站**：打造完全自主、完全离线的个人设备网络

## ✨ 核心功能

### 1. 文件传输

#### 支持的传输组合

| 发送端 | 接收端 | 支持状态 | 说明 |
|--------|--------|----------|------|
| PC ↔ PC | PC ↔ PC | ✅ | 支持Windows/macOS间互传，需两端安装软件 |
| PC ↔ Android | PC ↔ Android | ✅ | 跨平台文件传输，需两端安装软件 |
| Android ↔ Android | Android ↔ Android | ✅ | 移动端间互传，需两端安装软件 |

> ⚠️ **重要提示**：所有文件传输功能均需**两端都安装原生软件**才能使用

#### 特色功能

- **零点击传输**：局域网设备自动发现（mDNS）
- **量子加密传输**：基于X25519的端到端加密
- **闪电传输**：局域网内速度可达100MB/s
- **无界传输**：QUIC/TCP远程穿透NAT
- **原生性能**：充分利用系统能力，性能最优

### 2. 设备控制

#### 控制能力

- **Android控制PC**：手机远程控制电脑
  - 远程桌面：60FPS低延迟屏幕镜像
  - 跨端输入：手机控制电脑键鼠
  - 智能同步：剪贴板/通知同步

> ⚠️ **重要提示**：设备控制功能需要**两端都安装原生软件**才能使用

## 🛠️ 技术架构

### 1. 分层设计

```
┌─────────────────────────────────────────────────────┐
│                    UI层                              │
│  ┌─────────────┬──────────────────────────────────┐ │
│  │     PC      │         Android                  │ │
│  │   Tauri     │  ┌─────────────┬──────────────┐ │ │
│  │   + WRY     │  │  方案A:     │  方案B:      │ │ │
│  │   (React)   │  │  Compose    │  React Native│ │ │
│  │             │  │  (Kotlin)   │  (TS/JS)     │ │ │
│  └─────────────┴──┴─────────────┴──────────────┘ │ │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Native Modules层 (仅方案B)               │
│  ┌──────────────────────────────────────────────┐  │
│  │  React Native Native Modules (Kotlin/Java)   │  │
│  │  - Rust FFI绑定                               │  │
│  │  - 桥接层                                     │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                   核心层                             │
│  ┌──────────────────────────────────────────────┐  │
│  │         Rust核心库 (共享核心逻辑)             │  │
│  │  ┌──────────────┬──────────────┬──────────┐ │  │
│  │  │  P2P协议栈   │   加密模块   │ 文件管理  │ │  │
│  │  │  QUIC/TCP    │  ring-rs     │ 分片/合并 │ │  │
│  │  │  mDNS发现    │  X25519      │ 断点续传  │ │  │
│  │  │  NAT穿透     │  AES-256     │          │ │  │
│  │  └──────────────┴──────────────┴──────────┘ │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2. 关键技术栈建议

#### 2.1 前端技术栈

| 平台 | UI框架 | 构建工具 | 状态管理 | 说明 |
|------|--------|----------|----------|------|
| **PC端** | Tauri 2.0 | Vite | Zustand | 使用WebView渲染，Rust后端 |
| **Android端** | **方案A：Jetpack Compose** | Gradle | ViewModel + StateFlow | **Kotlin语言**，Material Design 3，完全原生 |
| **Android端** | **方案B：React Native + Expo** | Metro + EAS Build | Zustand/Jotai | TypeScript/JavaScript，跨平台UI，通过Native Modules调用Rust核心 |

> 💡 **移动端技术栈选择建议**：
> - **方案A（Jetpack Compose）**：使用**Kotlin**语言，完全原生，性能最优，适合追求极致性能的场景
> - **方案B（React Native + Expo）**：使用**TypeScript/JavaScript**，跨平台UI，代码复用率高，适合快速开发和未来扩展iOS

> ⚠️ **重要考虑：技术栈一致性**
> 
> **当前架构**：PC端使用 **Tauri（Rust + React）**
> 
> - **方案A（Kotlin + Compose）**：
>   - ❌ **技术栈不一致**：PC端是React生态，Android端是Kotlin生态
>   - ❌ **代码无法复用**：UI组件、业务逻辑需要维护两套代码
>   - ❌ **维护成本高**：需要熟悉React和Kotlin两套技术栈
>   - ✅ **性能最优**：完全原生，性能最佳
> 
> - **方案B（React Native + Expo）**：
>   - ✅ **技术栈统一**：PC端和Android端都使用React生态
>   - ✅ **代码高度复用**：UI组件、状态管理、业务逻辑可共享
>   - ✅ **维护成本低**：只需维护一套React代码
>   - ✅ **开发效率高**：一次开发，多端使用
>   - ⚠️ **性能略低**：通过Native Module调用Rust核心，性能影响很小
> 
> **推荐**：考虑到PC端已使用Tauri（React），**强烈推荐方案B（React Native + Expo）**，以实现技术栈统一和代码复用。

> 📝 **语言说明**：
> - **Jetpack Compose**：主要使用 **Kotlin**（不是Java）。虽然Android也支持Java，但Compose是Kotlin-first框架，现代Android开发推荐使用Kotlin
> - **React Native**：使用 **TypeScript/JavaScript**，Native Modules部分使用Kotlin/Java

#### 2.2 传输协议栈

| 场景 | 协议选择 | 技术实现 | 说明 |
|------|----------|----------|------|
| **PC ↔ PC** | QUIC / TCP直连 | quinn (Rust) | 局域网优先，NAT穿透备用 |
| **PC ↔ Android** | QUIC / TCP直连 | quinn (Rust) / OkHttp (Android) | 跨平台统一协议 |
| **Android ↔ Android** | QUIC / TCP直连 | OkHttp (Android) | 移动端间传输 |
| **设备发现** | mDNS | libmdns (Rust) / Android NSD | 局域网自动发现 |

#### 2.3 核心库推荐

**Rust核心库（共享）**
- `tokio` - 异步运行时
- `quinn` - QUIC协议实现
- `ring` - 加密算法库
- `serde` - 序列化/反序列化
- `libmdns` - mDNS设备发现
- `stun` - STUN协议（NAT穿透）

**Android端（方案A：原生）**
- `OkHttp` - HTTP/QUIC客户端
- `Conscrypt` - 加密库
- `Room` - 本地数据库（传输历史）
- `Android NSD` - 网络服务发现

**Android端（方案B：React Native + Expo）**
- `react-native` - React Native核心
- `expo` - Expo SDK（开发工具链）
- `@react-native-async-storage/async-storage` - 本地存储
- `react-native-fs` - 文件系统访问
- `react-native-network-info` - 网络信息
- **Native Modules**：
  - Rust核心库通过FFI封装为Native Module
  - `react-native-quic`（自定义模块，封装QUIC协议）
  - `react-native-mdns`（自定义模块，封装mDNS发现）

**PC端（Tauri）**
- **核心库**：直接使用Rust核心库（无需FFI，Tauri本身就是Rust）
- **文件系统**：`tauri-plugin-fs` - 文件系统访问
- **系统通知**：`tauri-plugin-notification` - 系统通知
- **剪贴板**：`tauri-plugin-clipboard-manager` 或 `clipboard` crate
- **系统API**：
  - Windows：`windows` crate - DXGI屏幕捕获、SendInput输入模拟
  - macOS：`core-graphics`、`avfoundation` crate - 屏幕捕获、CGEvent输入模拟
- **网络协议**：`quinn` (QUIC)、`tokio` (TCP)、`libmdns` (设备发现)
- **加密**：`ring`、`x25519-dalek` - 加密算法

#### 2.4 控制功能技术栈

| 功能 | PC端 | Android端 | 说明 |
|------|------|-----------|------|
| **屏幕捕获** | Windows: DXGI / macOS: AVFoundation | - | 原生API实现 |
| **输入模拟** | Windows: SendInput / macOS: CGEvent | Android InputManager | 需要系统权限 |
| **剪贴板同步** | Windows: Clipboard API / macOS: NSPasteboard | Android ClipboardManager | 系统API |
| **网络传输** | Rust核心库 (QUIC) | OkHttp (QUIC) | 低延迟传输 |

> 💡 **技术选型说明**：
> - **统一协议**：使用QUIC/TCP作为跨平台协议，原生端直接实现
> - **核心共享**：Rust核心库通过FFI供各平台调用，保证一致性
> - **原生优势**：充分利用系统能力，性能最优，功能完整

#### 2.5 技术栈选择理由

**为什么选择QUIC而非WebRTC？**
- ✅ 原生端无需浏览器限制，可直接使用最优协议
- ✅ QUIC性能更优，连接建立更快
- ✅ 内置多路复用和拥塞控制
- ✅ 更适合文件传输场景

**为什么选择Rust作为核心？**
- ✅ 性能优异，适合P2P网络处理
- ✅ 内存安全，减少安全漏洞
- ✅ 跨平台编译，一套代码多端使用
- ✅ 丰富的异步生态（tokio）

**为什么选择Tauri而非Electron？**
- ✅ 体积更小（~10MB vs ~100MB）
- ✅ 性能更好（系统WebView vs Chromium）
- ✅ 安全性更高（Rust后端）
- ✅ 资源占用更低

**Tauri能否满足产品功能需求？**

✅ **完全满足**，原因如下：

**1. 文件传输功能** ✅
- ✅ **文件系统访问**：`tauri-plugin-fs`提供完整的文件读写能力
- ✅ **网络协议**：Rust后端可直接使用`quinn`（QUIC）和`tokio`（TCP）
- ✅ **mDNS发现**：Rust后端可使用`libmdns`库
- ✅ **加密功能**：Rust后端可使用`ring`、`x25519-dalek`等加密库
- ✅ **大文件处理**：Rust后端可高效处理文件分片、断点续传

**2. 设备控制功能（PC端作为被控制端）** ✅
- ✅ **屏幕捕获**：
  - Windows：Rust后端可直接调用`windows` crate访问DXGI API
  - macOS：Rust后端可直接调用`core-graphics`和`avfoundation` crate
  - 可通过Tauri Command暴露给前端
- ✅ **输入模拟**：
  - Windows：Rust后端可使用`windows` crate的`SendInput` API
  - macOS：Rust后端可使用`core-graphics` crate的`CGEvent` API
  - 需要管理员权限（Tauri支持权限请求）
- ✅ **剪贴板同步**：
  - 可使用`tauri-plugin-clipboard-manager`或Rust的`clipboard` crate
  - 支持文本、图片等格式

**3. 网络功能** ✅
- ✅ **NAT穿透**：Rust后端可使用`stun`、`turn`等库
- ✅ **P2P连接**：Rust后端完全支持QUIC/TCP直连
- ✅ **设备发现**：Rust后端支持mDNS（局域网）和手动连接（远程）

**4. 系统集成** ✅
- ✅ **系统通知**：`tauri-plugin-notification`
- ✅ **后台运行**：Tauri支持系统托盘和后台服务
- ✅ **权限管理**：Tauri支持请求系统权限（网络、文件等）
- ✅ **自动启动**：可通过系统API实现开机自启

**实现方式**：
```
┌─────────────────────────────────────┐
│   Tauri前端 (React)                 │
│   - UI界面                          │
│   - 状态管理                        │
└─────────────────────────────────────┘
           ↓ (Tauri Command)
┌─────────────────────────────────────┐
│   Tauri Rust后端                     │
│   - 调用系统API（屏幕捕获、输入）    │
│   - 网络协议栈（QUIC/mDNS）          │
│   - 文件管理                         │
│   - 加密模块                         │
└─────────────────────────────────────┘
           ↓ (系统API)
┌─────────────────────────────────────┐
│   操作系统                           │
│   - Windows/macOS原生API             │
└─────────────────────────────────────┘
```

**注意事项**：
- ⚠️ **屏幕捕获权限**：macOS需要屏幕录制权限，Tauri可引导用户授权
- ⚠️ **输入模拟权限**：某些系统可能需要辅助功能权限
- ⚠️ **网络权限**：需要防火墙和网络访问权限
- ✅ **所有功能均可通过Rust后端实现**，Tauri提供了完整的系统访问能力

**为什么Jetpack Compose使用Kotlin而非Java？**
- ✅ **官方推荐**：Google官方推荐Kotlin作为Android开发的首选语言
- ✅ **Compose原生支持**：Jetpack Compose是Kotlin-first框架，语法更简洁
- ✅ **现代特性**：Kotlin提供协程、空安全、扩展函数等现代语言特性
- ✅ **互操作性**：Kotlin与Java 100%互操作，可调用Java库
- ✅ **开发效率**：代码更简洁，减少样板代码，提高开发效率
- ⚠️ **注意**：虽然Android也支持Java，但Jetpack Compose主要设计用于Kotlin，使用Java开发Compose会非常困难

**为什么使用mDNS进行设备发现？**
- ✅ 零配置，局域网自动发现
- ✅ 无需服务器，完全P2P
- ✅ 系统原生支持，性能好
- ✅ 隐私保护，不依赖外部服务

**移动端：React Native + Expo vs 原生Compose？**

**选择React Native + Expo的优势**：
- ✅ **技术栈统一**：与PC端Tauri（React）保持一致，代码复用率高
- ✅ **UI组件共享**：React组件可在PC端和Android端复用
- ✅ **状态管理统一**：Zustand等状态管理库可跨平台使用
- ✅ **业务逻辑复用**：文件选择、设备发现等逻辑可共享
- ✅ **跨平台潜力**：未来可扩展iOS，一套代码三端运行
- ✅ **开发效率**：React生态丰富，开发速度快
- ✅ **热更新**：Expo支持OTA更新，无需应用商店审核
- ✅ **维护成本低**：只需维护一套React代码库

**选择React Native + Expo的注意事项**：
- ⚠️ **原生模块**：需要将Rust核心库封装为Native Module（通过FFI）
- ⚠️ **性能考虑**：网络传输等核心功能通过Native Module实现，性能影响小（<5%）
- ⚠️ **Expo限制**：某些高级功能可能需要EAS Build或eject到bare workflow
- ⚠️ **包体积**：相比纯原生略大（~5-10MB），但可接受

**选择Jetpack Compose的劣势**：
- ❌ **技术栈不一致**：PC端React，Android端Kotlin，代码无法复用
- ❌ **维护成本高**：需要维护两套UI代码和业务逻辑
- ❌ **开发效率低**：新功能需要在两个平台分别实现
- ❌ **团队技能要求**：需要同时掌握React和Kotlin

**推荐方案**：
- **强烈推荐**：**React Native + Expo**（技术栈统一，代码复用，维护成本低）
- **备选方案**：**Jetpack Compose**（仅在追求极致性能且不考虑代码复用时选择）

### 3. 架构设计说明

#### 3.1 技术栈统一架构（推荐）

**核心思路**：PC端和Android端统一使用React生态，实现代码复用

**架构优势**：
- ✅ **UI组件共享**：React组件可在Tauri和React Native中复用
- ✅ **状态管理统一**：Zustand状态管理库跨平台使用
- ✅ **业务逻辑复用**：设备发现、文件选择等逻辑可共享
- ✅ **开发效率提升**：一次开发，多端运行

#### 3.2 架构对比：技术栈统一 vs 技术栈分离

**方案A：技术栈分离（Kotlin + Compose）**
```
PC端 (Tauri)              Android端 (Compose)
┌─────────────┐          ┌─────────────┐
│ React UI    │          │ Kotlin UI   │  ❌ 代码无法复用
│ Zustand     │          │ StateFlow   │  ❌ 维护两套代码
│ TypeScript  │          │ Kotlin      │  ❌ 技术栈不一致
└─────────────┘          └─────────────┘
      ↓                        ↓
┌─────────────────────────────────────┐
│      Rust核心库 (共享)                │
│  - P2P协议栈                          │
│  - 加密模块                           │
│  - 文件管理                           │
└─────────────────────────────────────┘
```

**方案B：技术栈统一（React Native + Expo）✅ 推荐**
```
PC端 (Tauri)              Android端 (RN)
┌─────────────┐          ┌─────────────┐
│ React UI    │◄────────►│ React UI    │  ✅ 组件共享
│ Zustand     │◄────────►│ Zustand     │  ✅ 状态共享
│ TypeScript  │◄────────►│ TypeScript  │  ✅ 逻辑复用
└─────────────┘          └─────────────┘
      ↓                        ↓
┌─────────────────────────────────────┐
│      Rust核心库 (共享)                │
│  - P2P协议栈                          │
│  - 加密模块                           │
│  - 文件管理                           │
└─────────────────────────────────────┘
```

#### 3.3 React Native + Expo 架构集成

**核心思路**：UI层使用React Native，核心功能通过Native Modules调用Rust库

```
┌─────────────────────────────────────────┐
│      React Native UI层 (JavaScript)     │
│  - React组件（与Tauri共享）             │
│  - Zustand状态管理（与Tauri共享）       │
│  - Expo SDK                             │
└─────────────────────────────────────────┘
              ↓ (Native Modules)
┌─────────────────────────────────────────┐
│      Native Modules (Kotlin/Java)       │
│  - Rust FFI绑定                          │
│  - QUIC/mDNS封装                        │
│  - 文件系统访问                          │
└─────────────────────────────────────────┘
              ↓ (FFI)
┌─────────────────────────────────────────┐
│      Rust核心库 (共享)                   │
│  - P2P协议栈                             │
│  - 加密模块                              │
│  - 文件管理                              │
└─────────────────────────────────────────┘
```

**实现要点**：
1. **Rust核心库封装**：通过`jni`或`cxx`创建Kotlin可调用的接口
2. **Native Module创建**：使用`@react-native-community/bob`或手动创建
3. **Expo配置**：使用`expo-build-properties`配置原生构建选项
4. **开发流程**：Expo Go用于UI开发，EAS Build用于完整功能测试

#### 3.3 代码复用示例

**共享UI组件（React）**：
```typescript
// shared/components/DeviceList.tsx
// 可在Tauri和React Native中复用
export function DeviceList({ devices, onSelect }: Props) {
  return (
    <View>
      {devices.map(device => (
        <DeviceItem 
          key={device.id} 
          device={device}
          onPress={() => onSelect(device)}
        />
      ))}
    </View>
  );
}
```

**共享业务逻辑（TypeScript）**：
```typescript
// shared/hooks/useDeviceDiscovery.ts
// 可在Tauri和React Native中复用
export function useDeviceDiscovery() {
  const [devices, setDevices] = useState([]);
  
  useEffect(() => {
    // PC端：通过Tauri调用Rust
    // Android端：通过Native Module调用Rust
    const discovered = discoverDevices();
    setDevices(discovered);
  }, []);
  
  return devices;
}
```

**共享状态管理（Zustand）**：
```typescript
// shared/stores/transferStore.ts
// 可在Tauri和React Native中复用
export const useTransferStore = create((set) => ({
  transfers: [],
  addTransfer: (transfer) => set((state) => ({
    transfers: [...state.transfers, transfer]
  }))
}));
```

#### 3.4 设备发现机制

**局域网发现（mDNS）**：
- **PC端**：使用`libmdns`（Rust）实现Bonjour/Zeroconf协议
- **Android端（原生）**：使用Android NSD（Network Service Discovery）API
- **Android端（RN）**：通过Native Module调用Rust的`libmdns`库
- **自动广播**：设备启动后自动在局域网内广播服务
- **零配置**：无需手动输入IP地址，自动发现周边设备

**远程连接**：
- 支持通过设备ID/二维码手动连接
- 使用STUN服务器进行NAT穿透
- 支持中继模式（可选，用于复杂网络环境）

#### 3.2 文件传输流程

**连接建立**：
1. 通过mDNS发现设备或手动输入设备ID
2. 建立QUIC/TCP连接
3. 进行密钥交换（X25519）
4. 开始文件传输

**传输优化**：
- 大文件自动分片传输
- 支持断点续传
- 并行传输多个文件
- 自适应压缩（可选）

#### 3.3 控制功能实现

**屏幕捕获**：
- Windows：使用DXGI Desktop Duplication API
- macOS：使用AVFoundation Screen Capture API
- 60FPS低延迟编码（H.264/H.265）

**输入模拟**：
- Windows：SendInput API
- macOS：CGEvent API
- Android：通过QUIC传输输入事件

**网络传输**：
- 使用QUIC协议保证低延迟
- 自适应码率控制
- 前向纠错（FEC）减少丢包影响

#### 3.4 Tauri实现示例

**屏幕捕获（Windows）**：
```rust
// src-tauri/src/main.rs
use windows::Win32::Graphics::Direct3D11::*;
use windows::Win32::Graphics::Dxgi::*;

#[tauri::command]
async fn capture_screen() -> Result<Vec<u8>, String> {
    // 使用DXGI Desktop Duplication API捕获屏幕
    // Rust可以直接调用Windows API
    let frame = capture_desktop_frame()?;
    Ok(frame)
}
```

**屏幕捕获（macOS）**：
```rust
// src-tauri/src/main.rs
use core_graphics::display::*;
use avfoundation::*;

#[tauri::command]
async fn capture_screen() -> Result<Vec<u8>, String> {
    // 使用AVFoundation或CoreGraphics捕获屏幕
    let frame = capture_screen_frame()?;
    Ok(frame)
}
```

**输入模拟（Windows）**：
```rust
// src-tauri/src/main.rs
use windows::Win32::UI::Input::KeyboardAndMouse::*;

#[tauri::command]
async fn simulate_key(key_code: u16) -> Result<(), String> {
    unsafe {
        let input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: key_code,
                    dwFlags: 0,
                    ..Default::default()
                }
            }
        };
        SendInput(&[input], std::mem::size_of::<INPUT>() as i32);
    }
    Ok(())
}
```

**文件传输（Tauri Command）**：
```rust
// src-tauri/src/main.rs
use tauri::Manager;

#[tauri::command]
async fn send_file(
    file_path: String,
    target_device_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // 调用Rust核心库进行文件传输
    let core = StationuliCore::new();
    core.send_file(&file_path, &target_device_id).await?;
    
    // 发送进度更新到前端
    app_handle.emit_all("transfer-progress", progress)?;
    Ok(())
}
```

**前端调用（React）**：
```typescript
// src/App.tsx
import { invoke } from '@tauri-apps/api/tauri';

// 屏幕捕获
const capture = await invoke<Uint8Array>('capture_screen');

// 输入模拟
await invoke('simulate_key', { keyCode: 65 }); // 'A'键

// 文件传输
await invoke('send_file', {
  filePath: '/path/to/file',
  targetDeviceId: 'device-123'
});
```

#### 3.5 React Native + Expo 实现示例

**Native Module封装（Kotlin）**：
```kotlin
// StationuliModule.kt
class StationuliModule(reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {
    
    // 加载Rust核心库
    init {
        System.loadLibrary("linkuli_core")
    }
    
    // Rust FFI函数声明
    external fun startMdnsDiscovery(): String
    external fun connectToDevice(deviceId: String): Boolean
    external fun sendFile(filePath: String, targetId: String): Promise
    
    @ReactMethod
    fun discoverDevices(promise: Promise) {
        val devices = startMdnsDiscovery()
        promise.resolve(devices)
    }
}
```

**React Native调用示例（TypeScript）**：
```typescript
// useStationuli.ts
import { NativeModules } from 'react-native';

const { StationuliModule } = NativeModules;

export function useDeviceDiscovery() {
  const [devices, setDevices] = useState([]);
  
  useEffect(() => {
    StationuliModule.discoverDevices().then((devices: string) => {
      setDevices(JSON.parse(devices));
    });
  }, []);
  
  return devices;
}

// 文件传输
export async function sendFile(
  filePath: string, 
  targetDeviceId: string
): Promise<void> {
  return StationuliModule.sendFile(filePath, targetDeviceId);
}
```

**Expo配置（app.json）**：
```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "minSdkVersion": 28,
            "targetSdkVersion": 34
          }
        }
      ]
    ]
  }
}
```

## 🔐 安全设计

### 四重防护体系

1. **连接层**：DTLS 1.3握手
2. **传输层**：AES-256-GCM加密
3. **应用层**：每会话独立密钥
4. **权限层**：设备指纹+生物识别

## 🚀 性能优化

### 传输加速技术

| 技术 | 适用场景 | 提速效果 |
|------|----------|----------|
| 前向纠错(FEC) | 高丢包网络 | +40% |
| 自适应压缩 | 图文文件 | +70% |
| 并行分片 | 大文件(>1GB) | +300% |

## 📌 部署要求

### PC端

| 平台 | 最低要求 | 说明 |
|------|----------|------|
| Windows | Win10 x64, 4GB RAM | 需要管理员权限（用于网络发现） |
| macOS | Big Sur, Apple Silicon/Intel | 需要网络权限授权 |

### Android端

- **系统要求**：Android 9.0+ (API 28+)
- **网络权限**：需要局域网访问权限
- **存储权限**：需要文件读写权限（用于文件传输）

> ⚠️ **重要**：所有功能均需安装原生软件，不支持Web端访问

## 💡 产品亮点

1. **完全自主**：不依赖任何第三方服务，所有数据仅在您的设备间传输
2. **完全离线**：支持局域网内完全离线运行，无需互联网连接
3. **完全私有**：端到端加密（X25519 + AES-256），数据绝不经过服务器
4. **个人工作站**：打造您的个人设备网络中心，打通PC与Android设备壁垒
5. **零配置使用**：局域网设备自动发现（mDNS），一键连接，开箱即用
6. **原生性能**：充分利用系统能力，性能最优，功能完整
7. **统一协议栈**：QUIC/TCP统一协议，确保各端完全兼容
8. **完全P2P**：所有数据传输均为点对点直连，您完全掌控数据流向

## 📞 联系我们

需要进一步讨论企业定制方案或SDK开放计划吗？欢迎联系我们！

---

**Stationuli** - 打造您的个人工作站，让设备连接更简单、更安全、更自主 🚀

