#!/usr/bin/env python3
"""
从 logo.png 生成桌面端和移动端所需的所有图标
"""
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

def ensure_pillow():
    """确保 Pillow 已安装"""
    try:
        import PIL
    except ImportError:
        print("正在安装 Pillow...")
        os.system("pip3 install Pillow")
        import PIL

def create_icon_set(source_image_path, output_dir, sizes):
    """创建指定尺寸的图标集"""
    source = Image.open(source_image_path)
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    created_files = []
    
    for size in sizes:
        # 调整图片大小，使用高质量重采样
        resized = source.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, f"{size}x{size}.png")
        resized.save(output_path, "PNG", optimize=True)
        created_files.append(output_path)
        print(f"✓ 生成 {output_path}")
    
    return created_files

def create_icns(source_image_path, output_path):
    """创建 macOS .icns 文件"""
    # .icns 需要多个尺寸，创建一个临时目录
    temp_dir = Path(output_path).parent / "icon.iconset"
    temp_dir.mkdir(exist_ok=True)
    
    source = Image.open(source_image_path)
    
    # macOS 需要的图标尺寸
    icns_sizes = [
        (16, "icon_16x16.png"),
        (32, "icon_16x16@2x.png"),
        (32, "icon_32x32.png"),
        (64, "icon_32x32@2x.png"),
        (128, "icon_128x128.png"),
        (256, "icon_128x128@2x.png"),
        (256, "icon_256x256.png"),
        (512, "icon_256x256@2x.png"),
        (512, "icon_512x512.png"),
        (1024, "icon_512x512@2x.png"),
    ]
    
    for size, filename in icns_sizes:
        resized = source.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(temp_dir / filename, "PNG")
    
    # 使用 iconutil 创建 .icns 文件
    iconutil_cmd = f'iconutil -c icns "{temp_dir}" -o "{output_path}"'
    result = os.system(iconutil_cmd)
    
    # 清理临时目录
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)
    
    if result == 0:
        print(f"✓ 生成 {output_path}")
        return True
    else:
        print(f"✗ 生成 {output_path} 失败")
        return False

def create_ico(source_image_path, output_path):
    """创建 Windows .ico 文件"""
    source = Image.open(source_image_path)
    
    # .ico 文件可以包含多个尺寸
    ico_sizes = [16, 32, 48, 64, 128, 256]
    images = []
    
    for size in ico_sizes:
        resized = source.resize((size, size), Image.Resampling.LANCZOS)
        images.append(resized)
    
    # 保存为 .ico 文件
    images[0].save(
        output_path,
        format='ICO',
        sizes=[(img.width, img.height) for img in images]
    )
    print(f"✓ 生成 {output_path}")

def main():
    ensure_pillow()
    
    # 路径配置
    root_dir = Path(__file__).parent
    logo_path = root_dir / "logo.png"
    
    if not logo_path.exists():
        print(f"错误: 找不到 {logo_path}")
        sys.exit(1)
    
    # 桌面端图标目录
    desktop_icons_dir = root_dir / "apps" / "desktop" / "src-tauri" / "icons"
    # 移动端图标目录
    mobile_icons_dir = root_dir / "apps" / "mobile" / "src-tauri" / "icons"
    
    print("=" * 50)
    print("开始生成图标...")
    print("=" * 50)
    
    # 桌面端需要的尺寸
    desktop_sizes = [32, 128, 256]  # 256 是 128x128@2x
    mobile_sizes = [30, 44, 71, 89, 107, 142, 150, 284, 310]  # 移动端额外尺寸
    
    # 生成桌面端图标
    print("\n📱 生成桌面端图标...")
    create_icon_set(logo_path, desktop_icons_dir, desktop_sizes)
    
    # 重命名 256x256 为 128x128@2x
    if (desktop_icons_dir / "256x256.png").exists():
        os.rename(
            desktop_icons_dir / "256x256.png",
            desktop_icons_dir / "128x128@2x.png"
        )
        print(f"✓ 重命名 256x256.png -> 128x128@2x.png")
    
    # 生成通用 icon.png (使用 512x512)
    source = Image.open(logo_path)
    icon_512 = source.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(desktop_icons_dir / "icon.png", "PNG", optimize=True)
    print(f"✓ 生成 {desktop_icons_dir / 'icon.png'}")
    
    # 生成 .icns 文件
    create_icns(logo_path, desktop_icons_dir / "icon.icns")
    
    # 生成 .ico 文件
    create_ico(logo_path, desktop_icons_dir / "icon.ico")
    
    # 生成移动端图标
    print("\n📱 生成移动端图标...")
    create_icon_set(logo_path, mobile_icons_dir, desktop_sizes + mobile_sizes)
    
    # 重命名 256x256 为 128x128@2x
    if (mobile_icons_dir / "256x256.png").exists():
        os.rename(
            mobile_icons_dir / "256x256.png",
            mobile_icons_dir / "128x128@2x.png"
        )
        print(f"✓ 重命名 256x256.png -> 128x128@2x.png")
    
    # 生成移动端 Square 系列图标
    print("\n📱 生成移动端 Square 系列图标...")
    square_sizes = [30, 44, 71, 89, 107, 142, 150, 284, 310]
    for size in square_sizes:
        source = Image.open(logo_path)
        resized = source.resize((size, size), Image.Resampling.LANCZOS)
        output_path = mobile_icons_dir / f"Square{size}x{size}Logo.png"
        resized.save(output_path, "PNG", optimize=True)
        print(f"✓ 生成 {output_path}")
    
    # 生成 StoreLogo.png (通常是 50x50 或 150x150)
    source = Image.open(logo_path)
    store_logo = source.resize((150, 150), Image.Resampling.LANCZOS)
    store_logo.save(mobile_icons_dir / "StoreLogo.png", "PNG", optimize=True)
    print(f"✓ 生成 {mobile_icons_dir / 'StoreLogo.png'}")
    
    # 生成移动端通用图标
    icon_512 = source.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(mobile_icons_dir / "icon.png", "PNG", optimize=True)
    print(f"✓ 生成 {mobile_icons_dir / 'icon.png'}")
    
    # 生成移动端 .icns 和 .ico
    create_icns(logo_path, mobile_icons_dir / "icon.icns")
    create_ico(logo_path, mobile_icons_dir / "icon.ico")
    
    print("\n" + "=" * 50)
    print("✅ 所有图标生成完成！")
    print("=" * 50)

if __name__ == "__main__":
    main()
