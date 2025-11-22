# 代码格式化工具配置

本项目配置了自动代码格式化工具，确保代码风格统一。

## 工具列表

### 1. Prettier（TypeScript/JavaScript/CSS/JSON/Markdown）

- **配置文件**：`.prettierrc.json`
- **忽略文件**：`.prettierignore`
- **版本**：3.6.2

### 2. rustfmt（Rust）

- **配置文件**：`rustfmt.toml`
- **版本**：1.8.0-stable

### 3. EditorConfig

- **配置文件**：`.editorconfig`
- 用于统一不同编辑器的基本配置

## 自动格式化（Git Hooks）

项目使用 **Husky** + **lint-staged** 实现 Git commit 时自动格式化：

- **Husky**：Git hooks 管理工具
- **lint-staged**：只格式化暂存区的文件

### 工作流程

1. 当你执行 `git commit` 时
2. `.husky/pre-commit` hook 会自动运行
3. `lint-staged` 会检查暂存区的文件
4. 自动格式化匹配的文件：
   - `*.{ts,tsx,js,jsx,json,css,md}` → Prettier
   - `*.rs` → `cargo fmt`

### 配置文件

- `.husky/pre-commit` - Git pre-commit hook
- `.lintstagedrc.json` - lint-staged 配置

## 手动格式化命令

### 格式化所有文件

```bash
# TypeScript/JavaScript/CSS/JSON/Markdown
pnpm format

# Rust
pnpm format:rust

# 或同时格式化
pnpm format && pnpm format:rust
```

### 检查格式（不修改文件）

```bash
# TypeScript/JavaScript/CSS/JSON/Markdown
pnpm format:check

# Rust
pnpm format:rust:check

# 或同时检查
pnpm lint
```

## 格式化规则

### Prettier 配置

- **缩进**：2 个空格
- **行宽**：80 字符
- **分号**：使用分号
- **引号**：双引号
- **尾随逗号**：ES5 风格
- **换行符**：LF (Unix)

### rustfmt 配置

- **行宽**：100 字符
- **缩进**：2 个空格
- **换行符**：Unix (LF)
- **合并导入**：启用
- **格式化字符串**：启用

## 常见问题

### Q: 如何跳过自动格式化？

```bash
# 使用 --no-verify 跳过 hooks
git commit --no-verify -m "your message"
```

### Q: 如何只格式化特定文件？

```bash
# 使用 Prettier
pnpm exec prettier --write "path/to/file.ts"

# 使用 rustfmt
cargo fmt -- path/to/file.rs
```

### Q: 如何更新格式化工具？

```bash
# 更新 Prettier
pnpm update -w prettier

# 更新 rustfmt（通过 Rust 工具链）
rustup update
```

## IDE 集成

### VSCode

项目已配置 `.vscode/settings.json`，推荐安装以下扩展：

- `esbenp.prettier-vscode` - Prettier 支持
- `rust-lang.rust-analyzer` - Rust 支持

### 配置保存时自动格式化

VSCode 已配置保存时自动格式化（见 `.vscode/settings.json`）。

## 注意事项

1. **首次提交**：首次运行 `git commit` 时，格式化工具会自动运行，可能需要一些时间
2. **大文件**：如果暂存区文件很大，格式化可能需要几秒钟
3. **冲突解决**：如果格式化后产生冲突，需要手动解决
4. **性能**：`lint-staged` 只格式化暂存区的文件，不会影响未暂存的文件
