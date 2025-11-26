#!/bin/bash

# Android 签名自动配置脚本
# 
# 工作流程：
# 1. 从 sign-apk/keystore.properties 读取配置
# 2. 复制到 gen/android/keystore.properties
# 3. 配置 build.gradle.kts 添加签名设置
#
# 这样即使删除 gen 目录，重新构建后运行此脚本即可恢复签名配置

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAURI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GEN_DIR="$TAURI_DIR/gen/android"
BUILD_GRADLE="$GEN_DIR/app/build.gradle.kts"
KEYSTORE_PROPERTIES_SOURCE="$SCRIPT_DIR/keystore.properties"
KEYSTORE_PROPERTIES_TARGET="$GEN_DIR/keystore.properties"
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

# 检查 sign-apk/keystore.properties 是否存在
if [ ! -f "$KEYSTORE_PROPERTIES_SOURCE" ]; then
    echo "❌ 错误: 未找到 sign-apk/keystore.properties"
    echo ""
    echo "请按照以下步骤操作："
    echo "1. 复制 keystore.properties.example 为 keystore.properties："
    echo "   cp sign-apk/keystore.properties.example sign-apk/keystore.properties"
    echo ""
    echo "2. 编辑 sign-apk/keystore.properties，填入您的密钥库信息"
    echo ""
    echo "3. 重新运行此脚本"
    exit 1
fi

# 复制 keystore.properties 到 gen/android/
echo "📋 复制签名配置到 gen/android/keystore.properties..."
cp "$KEYSTORE_PROPERTIES_SOURCE" "$KEYSTORE_PROPERTIES_TARGET"
echo "✅ 已复制签名配置"

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
    echo "✅ 已添加签名配置"
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
        echo "✅ 已配置 release buildType"
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
    echo "✅ 已添加 release buildType"
fi

# 清理备份文件
rm -f "$BUILD_GRADLE.bak"

echo ""
echo "✅ Android 签名配置完成!"
echo ""
echo "📋 配置说明："
echo "  - 签名配置已从 sign-apk/keystore.properties 复制到 gen/android/keystore.properties"
echo "  - build.gradle.kts 已配置签名设置"
echo ""
echo "🚀 下一步："
echo "  运行构建: cd apps/mobile && pnpm tauri android build"
echo ""
echo "💡 提示："
echo "  - 即使删除 gen 目录，重新构建后运行此脚本即可恢复签名配置"
echo "  - 签名配置保存在 sign-apk/keystore.properties，不会被删除"
echo ""
