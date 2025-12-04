[English](./CHANGELOG.md) | 中文

# 变更日志

本项目的所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.0.1] - 2025-12-04

### Added

- 🎉 **首次发布**
- ✨ **文件传输功能**: PC ↔ PC、PC ↔ Android、Android ↔ Android 之间快速传输文件
- 🔍 **设备发现**: 局域网自动发现设备 (mDNS)，零配置使用
- 🔐 **端到端加密**: X25519 + AES-256 加密，数据绝不经过服务器
- 📱 **跨平台支持**: 支持 macOS、Windows 和 Android 平台
- 🎨 **现代化 UI**: 采用 Tailwind CSS 构建的现代化界面
- 📱 **响应式设计**: 桌面端和移动端都有优化的界面体验
- 🖱️ **拖拽上传**: 桌面端支持拖拽文件上传
- ⚡ **流畅交互**: 优化的动画和过渡效果

### Technical

- 使用 Tauri 框架构建跨平台应用
- Rust 后端实现 P2P 文件传输
- React + TypeScript 前端
- 支持 mDNS 设备发现
- QUIC 协议用于文件传输

---

## 版本说明

- **Added**: 新功能
- **Changed**: 功能变更
- **Deprecated**: 即将移除的功能
- **Removed**: 已移除的功能
- **Fixed**: 问题修复
- **Security**: 安全更新
