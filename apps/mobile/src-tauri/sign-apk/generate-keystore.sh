#!/bin/bash

# Android 密钥库生成脚本
# 用于生成 Tauri Android 应用签名所需的密钥库文件
#
# 使用方法:
#   ./scripts/generate-keystore.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYSTORE_DIR="$HOME"
KEYSTORE_NAME="upload-keystore.jks"
KEYSTORE_PATH="$KEYSTORE_DIR/$KEYSTORE_NAME"

echo "=========================================="
echo "Android 密钥库生成工具"
echo "=========================================="
echo ""

# 检查 keytool 是否可用
if ! command -v keytool &> /dev/null; then
    echo "❌ 错误: 未找到 keytool 命令"
    echo ""
    echo "keytool 是 Java 的一部分，通常随 Android Studio 一起安装。"
    echo "请尝试以下路径之一："
    echo ""
    echo "macOS:"
    echo "  /Applications/Android\\ Studio.app/Contents/jbr/Contents/Home/bin/keytool"
    echo ""
    echo "Linux:"
    echo "  /opt/android-studio/jbr/bin/keytool"
    echo ""
    echo "Windows:"
    echo "  C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe"
    echo ""
    echo "或者将 keytool 添加到 PATH 环境变量中。"
    exit 1
fi

# 检查密钥库是否已存在
if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️  警告: 密钥库文件已存在: $KEYSTORE_PATH"
    read -p "是否要覆盖现有密钥库? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消操作。"
        exit 0
    fi
    rm -f "$KEYSTORE_PATH"
fi

echo "正在生成密钥库..."
echo "密钥库位置: $KEYSTORE_PATH"
echo ""
echo "请按照提示输入以下信息："
echo "  - 密钥库密码（请妥善保管）"
echo "  - 密钥密码（可以与密钥库密码相同）"
echo "  - 您的姓名和组织信息"
echo ""

# 生成密钥库
keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias upload \
    -storetype JKS

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 密钥库生成成功!"
    echo ""
    echo "密钥库位置: $KEYSTORE_PATH"
    echo ""
    echo "📋 下一步操作："
    echo "1. 首次构建以生成 Android 项目结构："
    echo "   cd apps/mobile"
    echo "   pnpm tauri android build"
    echo ""
    echo "2. 创建签名配置文件："
    echo "   cd apps/mobile/src-tauri"
    echo "   cp sign-apk/keystore.properties.example sign-apk/keystore.properties"
    echo ""
    echo "3. 编辑 sign-apk/keystore.properties，填入密钥库信息："
    echo "   storeFile=$KEYSTORE_PATH"
    echo ""
    echo "4. 运行签名配置脚本："
    echo "   ./sign-apk/setup-android-signing.sh"
    echo ""
    echo "⚠️  重要提示："
    echo "   - 请妥善保管密钥库文件和密码"
    echo "   - 不要将密钥库文件提交到版本控制系统"
    echo "   - 建议备份密钥库文件到安全位置"
    echo "   - 丢失密钥库将无法更新已发布的应用"
else
    echo ""
    echo "❌ 密钥库生成失败"
    exit 1
fi
