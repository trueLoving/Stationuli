# Android 应用签名配置指南

本文档说明如何为 Tauri Android 应用配置代码签名。**未签名的 APK 无法安装到设备上**。

## 📋 前置要求

- Java JDK（通常随 Android Studio 一起安装）
- `keytool` 命令可用（Java 的一部分）

## 🚀 快速开始（推荐流程）

### 步骤 1: 生成密钥库

#### macOS/Linux

```bash
cd apps/mobile/src-tauri
chmod +x sign-apk/generate-keystore.sh
./sign-apk/generate-keystore.sh
```

#### Windows

```cmd
cd apps\mobile\src-tauri
sign-apk\generate-keystore.bat
```

密钥库将生成在：

- **macOS/Linux**: `~/upload-keystore.jks`
- **Windows**: `%USERPROFILE%\upload-keystore.jks`

### 步骤 2: 首次构建（生成 Android 项目结构）

```bash
cd apps/mobile
pnpm tauri android build
```

首次构建会生成 `gen/android/` 目录和 Android 项目文件。

### 步骤 3: 创建签名配置文件

复制 `keystore.properties.example` 为 `keystore.properties`：

```bash
cd apps/mobile/src-tauri
cp sign-apk/keystore.properties.example sign-apk/keystore.properties
```

### 步骤 4: 编辑密钥库配置

编辑 `sign-apk/keystore.properties`，填入您的密钥库信息：

```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=upload
storeFile=/Users/你的用户名/upload-keystore.jks
```

**Windows 路径示例：**

```properties
storeFile=C:\\Users\\你的用户名\\upload-keystore.jks
```

### 步骤 5: 配置签名

运行签名配置脚本：

```bash
cd apps/mobile/src-tauri
chmod +x sign-apk/setup-android-signing.sh
./sign-apk/setup-android-signing.sh
```

此脚本会自动：

- 将 `sign-apk/keystore.properties` 复制到 `gen/android/keystore.properties`
- 配置 `gen/android/app/build.gradle.kts` 添加签名设置

### 步骤 6: 重新构建

```bash
cd apps/mobile
pnpm tauri android build
```

现在构建的 APK 将自动使用您的密钥库进行签名。

## 🔄 重新生成 gen 目录后的签名恢复

如果删除了 `gen` 目录，重新构建后只需运行签名配置脚本即可恢复签名：

```bash
# 重新构建（会重新生成 gen 目录）
cd apps/mobile
pnpm tauri android build

# 恢复签名配置
cd src-tauri
./sign-apk/setup-android-signing.sh
```

**优势：**

- 签名配置保存在 `sign-apk/keystore.properties`，不会被删除
- 重新构建后只需运行一个脚本即可恢复签名配置
- 无需手动备份和恢复

## 📝 手动配置（高级）

如果您需要手动配置，请参考以下步骤：

1. **创建签名配置文件**：

   ```bash
   cp sign-apk/keystore.properties.example sign-apk/keystore.properties
   ```

2. **编辑 `sign-apk/keystore.properties`**，填入密钥库信息

3. **修改 `gen/android/app/build.gradle.kts`**：

   a. 在文件开头添加导入（如果不存在）：

   ```kotlin
   import java.util.Properties
   ```

   b. 在 `buildTypes` 块之前添加签名配置：

   ```kotlin
   signingConfigs {
       create("release") {
           val keystorePropertiesFile = rootProject.file("keystore.properties")
           if (keystorePropertiesFile.exists()) {
               val keystoreProperties = Properties()
               keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
               keyAlias = keystoreProperties["keyAlias"] as String
               keyPassword = keystoreProperties["keyPassword"] as String
               storeFile = file(keystoreProperties["storeFile"] as String)
               storePassword = keystoreProperties["storePassword"] as String
           }
       }
   }
   ```

   c. 在 `buildTypes` 的 `release` 配置中使用签名：

   ```kotlin
   buildTypes {
       getByName("release") {
           signingConfig = signingConfigs.getByName("release")
       }
   }
   ```

## 📁 文件结构

```
apps/mobile/src-tauri/
├── sign-apk/                      # Android 签名脚本目录
│   ├── README.md                  # 本文档
│   ├── generate-keystore.sh       # 生成密钥库脚本 (macOS/Linux)
│   ├── generate-keystore.bat      # 生成密钥库脚本 (Windows)
│   ├── setup-android-signing.sh   # 自动配置签名脚本
│   ├── keystore.properties.example # 密钥库配置模板
│   └── keystore.properties        # 密钥库配置（用户创建，不要提交）
└── gen/android/                   # 构建时生成
    ├── keystore.properties        # 从 sign-apk/ 复制（不要提交）
    └── app/
        └── build.gradle.kts       # 构建配置（已自动配置签名）
```

## 🔧 脚本说明

### `generate-keystore.sh` / `generate-keystore.bat`

生成 Android 签名密钥库文件。

**功能：**

- 检查 `keytool` 是否可用
- 生成密钥库文件到用户主目录
- 提示用户输入密钥库信息

**使用方法：**

```bash
# macOS/Linux
./sign-apk/generate-keystore.sh

# Windows
sign-apk\generate-keystore.bat
```

### `setup-android-signing.sh`

自动配置 Android 签名设置。

**功能：**

- 检查 `sign-apk/keystore.properties` 是否存在
- 将 `sign-apk/keystore.properties` 复制到 `gen/android/keystore.properties`
- 自动修改 `build.gradle.kts` 添加签名配置
- 即使删除 gen 目录，重新构建后运行此脚本即可恢复签名配置

**使用方法：**

```bash
./sign-apk/setup-android-signing.sh
```

**工作流程：**

1. 从 `sign-apk/keystore.properties` 读取配置（需要先创建并填写）
2. 复制到 `gen/android/keystore.properties`
3. 配置 `build.gradle.kts` 添加签名设置

## 🔐 安全提示

1. **不要提交密钥库文件到版本控制**
   - 密钥库文件（`.jks`）已添加到 `.gitignore`
   - `gen/android/keystore.properties` 也已添加到 `.gitignore`

2. **妥善保管密钥库和密码**
   - 丢失密钥库将无法更新已发布的应用
   - 建议备份密钥库到安全位置（如密码管理器或加密存储）

3. **使用不同的密钥库**
   - 开发环境可以使用调试密钥库
   - 生产环境必须使用发布密钥库

4. **密钥库文件位置**
   - 默认保存在用户主目录：`~/upload-keystore.jks` 或 `%USERPROFILE%\upload-keystore.jks`
   - 可以在 `keystore.properties` 中指定其他位置

## ⚠️ 注意事项

- 所有脚本都需要在 `apps/mobile/src-tauri` 目录下运行
- 密钥库文件会保存在用户主目录
- 不要将密钥库文件或 `keystore.properties` 提交到版本控制

## 📚 参考文档

- [Tauri Android 签名文档](https://tauri.app/zh-cn/distribute/sign/android/)
- [Android 应用签名指南](https://developer.android.com/studio/publish/app-signing)

## ❓ 常见问题

### Q: 找不到 keytool 命令？

**A:** `keytool` 是 Java 的一部分，通常随 Android Studio 安装。可以尝试以下路径：

- **macOS**: `/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool`
- **Linux**: `/opt/android-studio/jbr/bin/keytool`
- **Windows**: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`

或者将完整路径添加到命令中。也可以使用 Android Studio 自带的 JDK：

```bash
# macOS
/Applications/Android\ Studio.app/Contents/jbr/Contents/Home/bin/keytool -genkey ...
```

### Q: 构建时提示找不到 keystore.properties？

**A:** 确保：

1. 已创建 `sign-apk/keystore.properties` 文件（从 `keystore.properties.example` 复制）
2. 已编辑 `sign-apk/keystore.properties` 填入正确的密钥库信息
3. 已运行首次构建生成 `gen/android/` 目录
4. 已运行 `setup-android-signing.sh` 脚本
5. 文件中的路径和密码正确
6. 密钥库文件路径正确（使用绝对路径）

### Q: APK 仍然无法安装？

**A:** 检查：

1. 确保构建的是 release 版本（debug 版本使用调试签名）
2. 验证 APK 签名：`apksigner verify --verbose your-app.apk`
3. 确保设备满足 `minSdkVersion` 要求（当前为 28，Android 9.0+）
4. 检查设备是否允许安装未知来源的应用

### Q: 如何验证 APK 签名？

**A:** 使用 `apksigner` 工具：

```bash
# 验证签名
apksigner verify --verbose your-app.apk

# 查看签名信息
apksigner verify --print-certs your-app.apk
```

如果签名正确，将显示签名信息。

### Q: 构建时出现 "Unresolved reference: FileInputStream" 错误？

**A:** 这是旧版本配置脚本的问题。新版本已修复，使用 Kotlin 风格的 `inputStream().use`。如果遇到此错误，请重新运行 `setup-android-signing.sh` 脚本。

### Q: 如何更新密钥库密码？

**A:** 使用 `keytool` 命令：

```bash
keytool -storepasswd -keystore ~/upload-keystore.jks
```

然后更新 `keystore.properties` 中的 `storePassword`。

### Q: 密钥库文件可以移动吗？

**A:** 可以，只需更新 `keystore.properties` 中的 `storeFile` 路径即可。建议使用绝对路径。

### Q: 删除 gen 目录后签名配置会丢失吗？

**A:** 不会！签名配置保存在 `sign-apk/keystore.properties`，不会被删除。

**恢复签名配置：**

```bash
# 重新构建（会重新生成 gen 目录）
cd apps/mobile
pnpm tauri android build

# 恢复签名配置（只需运行一个脚本）
cd src-tauri
./sign-apk/setup-android-signing.sh
```

脚本会自动：

- 从 `sign-apk/keystore.properties` 复制配置到 `gen/android/keystore.properties`
- 重新配置 `build.gradle.kts` 添加签名设置

**优势：**

- 签名配置永久保存在 `sign-apk/` 目录
- 重新构建后只需运行一个脚本即可恢复
- 无需手动备份和恢复
