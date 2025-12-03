[English](./README.md) | 中文

# Stationuli —— 个人工作站P2P文件传输与控制解决方案

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](https://mariadb.com/bsl11/)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/trueLoving/Stationuli)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Rust](https://img.shields.io/badge/rust-2024-orange.svg)](https://www.rust-lang.org/)

🔗 **完全离线、完全私有的P2P文件传输与设备控制** - 打通PC与Android设备壁垒

## 💭 项目初衷

Stationuli 的诞生源于三个核心驱动力：

1. **项目经历积累** 📚：在之前的项目开发中，深入探索了不同设备在离线环境下的文件传输技术，特别是 Android 到 PC 端的传输场景，积累了丰富的实践经验。

2. **个人真实需求** 🏠：作为开发者，迫切需要一套软件来搭建完全属于自己的个人工作站，实现设备打通、完全私有、离线优先、自主控制。

3. **技术探索精神** 🔬：Stationuli 也是研究不同领域技术生态的实践平台，探索 Rust 生态、跨平台开发、P2P 网络、系统集成等前沿技术。

## 📦 制品下载

| 平台        | 架构        | 下载链接                                                                                                          | 说明                           |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Windows** | x64         | [下载 Windows 版本](https://github.com/trueLoving/Stationuli/releases/latest/download/stationuli-windows-x64.exe) | Windows 10+                    |
| **macOS**   | Universal   | [下载 macOS 版本](https://github.com/trueLoving/Stationuli/releases/latest/download/stationuli-macos.dmg)         | Big Sur+ (Apple Silicon/Intel) |
| **Android** | ARM64/ARMv7 | [下载 Android 版本](https://github.com/trueLoving/Stationuli/releases/latest/download/stationuli-android.apk)     | Android 9.0+ (API 28+)         |

> 📌 **提示**：所有功能均需两端安装原生软件才能使用，不支持Web端访问

## 📖 关于产品

### 产品是什么

Stationuli 是一个**完全自主、完全离线、完全私有**的个人工作站解决方案，帮助您：

- **文件传输**：PC ↔ PC、PC ↔ Android、Android ↔ Android 之间快速传输文件
- **设备控制**：Android 远程控制 PC（屏幕镜像、键鼠控制、剪贴板同步）
- **零配置使用**：局域网自动发现设备，一键连接，开箱即用

### 产品定位

纯P2P跨平台文件传输与控制工具：

- 🖥️ **PC端**：Windows/macOS 原生应用
- 📱 **移动端**：Android 原生应用
- 🔄 **全平台互通**：PC 与 Android 间文件传输与设备控制
- 🏠 **个人工作站**：打造完全自主、完全离线的个人设备网络

### 核心特性

1. **完全自主**：不依赖任何第三方服务，所有数据仅在您的设备间传输
2. **完全离线**：支持局域网内完全离线运行，无需互联网连接
3. **完全私有**：端到端加密（X25519 + AES-256），数据绝不经过服务器
4. **零配置使用**：局域网设备自动发现（mDNS），一键连接，开箱即用
5. **原生性能**：充分利用系统能力，性能最优，功能完整

## 🤝 贡献

我们欢迎贡献！请阅读我们的[贡献指南](CONTRIBUTING.zh-CN.md)开始。

- [Contributing Guide (English)](CONTRIBUTING.md)
- [贡献指南 (中文)](CONTRIBUTING.zh-CN.md)

## 📄 许可证

本项目采用 **Business Source License (BSL) 1.1** 许可证。

- **个人/非生产环境使用**：个人使用、开发、测试、教育和研究免费
- **小企业使用**：员工少于 5 人或年收入低于 10 万美元的组织可免费使用
- **商业使用**：生产环境的商业使用需要许可证。商业许可咨询请联系作者
- **转换日期**：2029-01-01 后，本软件将转换为 GPL v2.0 或更高版本

详见 [LICENSE](./LICENSE) 文件。

---

**Stationuli** - 打造您的个人工作站，让设备连接更简单、更安全、更自主 🚀
