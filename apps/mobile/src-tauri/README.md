# Stationuli Mobile (Tauri)

Stationuli 移动端应用，基于 Tauri 2.0 构建。

## 📱 平台支持

- Android 9.0+ (API 28+)

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
cd apps/mobile
pnpm dev
```

### 构建应用

```bash
cd apps/mobile
pnpm tauri android build
```

## 🔐 Android 签名配置

**重要：** 未签名的 APK 无法安装到设备上。请参考 [sign-apk/README.md](./sign-apk/README.md) 配置应用签名。

### 快速配置签名

1. 生成密钥库：

   ```bash
   cd apps/mobile/src-tauri
   ./sign-apk/generate-keystore.sh
   ```

2. 首次构建：

   ```bash
   cd apps/mobile
   pnpm tauri android build
   ```

3. 创建签名配置文件：

   ```bash
   cd apps/mobile/src-tauri
   cp sign-apk/keystore.properties.example sign-apk/keystore.properties
   ```

4. 编辑 `sign-apk/keystore.properties`，填入密钥库信息

5. 配置签名：

   ```bash
   ./sign-apk/setup-android-signing.sh
   ```

6. 重新构建

详细说明请查看 [sign-apk/README.md](./sign-apk/README.md)。

## 📁 项目结构

```
apps/mobile/
├── src/                    # 前端源代码
├── src-tauri/              # Tauri 后端
│   ├── sign-apk/          # Android 签名脚本和文档
│   │   └── README.md       # Android 签名配置指南
│   └── gen/                # 构建时生成的文件
└── package.json
```

## 📚 相关文档

- [Android 签名配置指南](./sign-apk/README.md)
- [Tauri 官方文档](https://tauri.app/)
