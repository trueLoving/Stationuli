#!/bin/bash

# Android 签名自动配置脚本
# 此脚本会自动配置 Android 应用的签名设置

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GEN_DIR="$TAURI_DIR/gen/android"
BUILD_GRADLE="$GEN_DIR/app/build.gradle.kts"
KEYSTORE_PROPERTIES="$GEN_DIR/keystore.properties"
KEYSTORE_PROPERTIES_EXAMPLE="$SCRIPT_DIR/keystore.properties.example"

echo "=========================================="
echo "Android 签名配置工具"
echo "=========================================="
echo ""

# 检查 gen 目录是否存在（需要先运行一次构建）
if [ ! -d "$GEN_DIR" ]; then
    echo "❌ 错误: gen/android 目录不存在"
    echo ""
    echo "请先运行一次构建以生成 Android 项目结构："
    echo "  cd apps/mobile"
    echo "  pnpm tauri android build"
    exit 1
fi

# 检查 build.gradle.kts 是否存在
if [ ! -f "$BUILD_GRADLE" ]; then
    echo "❌ 错误: build.gradle.kts 不存在"
    echo ""
    echo "请先运行一次构建以生成 Android 项目结构："
    echo "  cd apps/mobile"
    echo "  pnpm tauri android build"
    exit 1
fi

# 检查是否已经配置了签名
if grep -q "signingConfigs" "$BUILD_GRADLE"; then
    echo "✅ 签名配置已存在"
    echo ""
    read -p "是否要重新配置? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消操作。"
        exit 0
    fi
    echo "正在移除现有配置..."
    # 这里可以添加移除逻辑，但为了安全，建议手动检查
fi

# 检查并创建 keystore.properties
if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
    if [ -f "$KEYSTORE_PROPERTIES_EXAMPLE" ]; then
        echo "📋 复制 keystore.properties.example 到 gen/android/keystore.properties"
        cp "$KEYSTORE_PROPERTIES_EXAMPLE" "$KEYSTORE_PROPERTIES"
        echo "⚠️  请编辑 gen/android/keystore.properties 并填入您的密钥库信息"
        echo ""
    else
        echo "❌ 错误: 未找到 keystore.properties.example"
        exit 1
    fi
else
    echo "✅ keystore.properties 已存在"
fi

# 检查 build.gradle.kts 是否已经包含必要的导入
if ! grep -q "import java.util.Properties" "$BUILD_GRADLE"; then
    echo "📝 添加必要的导入..."
    sed -i.bak '1a\
import java.util.Properties
' "$BUILD_GRADLE"
fi

# 查找 buildTypes 块的位置
BUILDTYPES_LINE=$(grep -n "buildTypes {" "$BUILD_GRADLE" | head -1 | cut -d: -f1)

if [ -z "$BUILDTYPES_LINE" ]; then
    echo "❌ 错误: 未找到 buildTypes 块"
    exit 1
fi

# 检查是否已存在 signingConfigs
if ! grep -q "signingConfigs {" "$BUILD_GRADLE"; then
    # 在 buildTypes 之前插入 signingConfigs
    echo "📝 配置签名设置..."
    sed -i.bak "${BUILDTYPES_LINE}i\\
    signingConfigs {\\
        create(\"release\") {\\
            val keystorePropertiesFile = rootProject.file(\"keystore.properties\")\\
            if (keystorePropertiesFile.exists()) {\\
                val keystoreProperties = Properties()\\
                keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }\\
                keyAlias = keystoreProperties[\"keyAlias\"] as String\\
                keyPassword = keystoreProperties[\"keyPassword\"] as String\\
                storeFile = file(keystoreProperties[\"storeFile\"] as String)\\
                storePassword = keystoreProperties[\"storePassword\"] as String\\
            }\\
        }\\
    }\\
" "$BUILD_GRADLE"
else
    echo "✅ signingConfigs 已存在"
fi

# 修改 release buildType 使用签名配置
if grep -q 'getByName("release")' "$BUILD_GRADLE"; then
    # 检查是否已配置 signingConfig
    if ! grep -A 5 'getByName("release")' "$BUILD_GRADLE" | grep -q "signingConfig"; then
        echo "📝 配置 release buildType 使用签名..."
        sed -i.bak '/getByName("release") {/a\
            signingConfig = signingConfigs.getByName("release")
' "$BUILD_GRADLE"
    else
        echo "✅ release buildType 已配置签名"
    fi
else
    # 如果 release 块不存在，在 buildTypes 中添加
    echo "📝 添加 release buildType 配置..."
    sed -i.bak '/buildTypes {/a\
        getByName("release") {\
            signingConfig = signingConfigs.getByName("release")\
        }
' "$BUILD_GRADLE"
fi

# 清理备份文件
rm -f "$BUILD_GRADLE.bak"

echo ""
echo "✅ Android 签名配置完成!"
echo ""
echo "下一步："
echo "1. 编辑 gen/android/keystore.properties，填入您的密钥库信息"
echo "2. 运行构建: cd apps/mobile && pnpm tauri android build"
echo ""
