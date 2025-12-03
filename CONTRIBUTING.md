# Contributing to Stationuli

Thank you for your interest in contributing to Stationuli! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Questions and Support](#questions-and-support)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20 or higher
- **pnpm**: v10.18.3 (required package manager)
- **Rust**: Latest stable version (2024 edition)

### Platform-Specific Requirements

#### Desktop Development

- **Windows**: Visual Studio Build Tools or Visual Studio with C++ workload
- **macOS**: Xcode Command Line Tools
- **Linux**: `libwebkit2gtk-4.0-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`

#### Mobile Development (Android)

- **Android Studio**: Latest version
- **Android SDK**: API 28+ (Android 9.0+)
- **Java**: JDK 17
- **Android NDK**: Version 25.1.8937393 or compatible

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Stationuli.git
cd Stationuli
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend and backend)
pnpm install
```

### 3. Verify Installation

```bash
# Check code formatting
pnpm format:check
pnpm format:rust:check

# Run linting
pnpm lint
```

## Project Structure

```
Stationuli/
├── apps/
│   ├── desktop/          # Desktop application (Tauri + React)
│   └── mobile/           # Mobile application (Tauri + React)
├── packages/
│   ├── common/           # Shared resources (TypeScript/React)
│   │   ├── src/
│   │   │   ├── api/      # API interface definitions
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── hooks/   # Shared React hooks
│   │   │   ├── stores/   # Shared state management
│   │   │   ├── types/   # Shared TypeScript types
│   │   │   └── utils/   # Shared utility functions
│   │   └── package.json
│   └── core/             # Core library (Rust)
│       └── src/
│           ├── p2p/      # P2P networking (mDNS, TCP)
│           ├── file/     # File transfer
│           └── crypto/   # Cryptography
├── .github/
│   ├── workflows/        # GitHub Actions workflows
│   └── design/          # Design documents
└── package.json         # Root package.json
```

For more details, see [Design Documents](.github/design/README.md).

## Development Workflow

### Running Development Servers

```bash
# Desktop development
pnpm dev:desktop

# Mobile development (Android)
pnpm dev:mobile
```

### Building Applications

```bash
# Build desktop app
pnpm build:desktop

# Build mobile app (APK)
pnpm build:mobile
```

### Working with Shared Packages

The `packages/common` package contains shared code used by both desktop and mobile apps:

- **API Interfaces**: Define `DeviceApi` and `FileApi` interfaces
- **React Hooks**: `useDiscovery`, `useFileTransfer`
- **UI Components**: Reusable components like `ServiceStatusCard`, `DeviceList`
- **State Management**: Zustand stores for devices and transfers
- **Type Definitions**: Shared TypeScript types

When modifying shared code, ensure it works for both platforms.

## Coding Standards

### TypeScript/React

- **Formatting**: Use Prettier (configured in `.prettierrc`)
- **Linting**: Follow ESLint rules
- **Type Safety**: Use TypeScript strictly, avoid `any`
- **Component Structure**: Functional components with hooks
- **Naming**:
  - Components: PascalCase (`ServiceStatusCard`)
  - Hooks: camelCase starting with `use` (`useDiscovery`)
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE

### Rust

- **Formatting**: Use `rustfmt` (configured in `rustfmt.toml`)
- **Linting**: Use `clippy` for additional checks
- **Error Handling**: Use `Result<T, E>` for error handling
- **Async**: Use `tokio` for async operations
- **Naming**: Follow Rust naming conventions (snake_case)

### Code Style Examples

**TypeScript:**

```typescript
// Good
export function useDiscovery({ deviceApi, defaultPort }: UseDiscoveryOptions) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  // ...
}

// Bad
export function useDiscovery(options: any) {
  const [devices, setDevices] = useState([]);
  // ...
}
```

**Rust:**

```rust
// Good
pub async fn start_discovery(
    port: u16,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // ...
}

// Bad
pub async fn start_discovery(port: u16, state: State) -> String {
    // ...
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```
feat(desktop): add dark mode toggle

Implement dark mode support for desktop application with system preference detection.

Closes #123
```

```
fix(mobile): resolve Android file permission issue

Fix content URI permission handling on Android by adding persistent URI permission request.

Fixes #456
```

```
docs(common): update API documentation

Add examples for DeviceApi and FileApi interfaces.
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically:

- Format code with Prettier (TypeScript/JavaScript/JSON/Markdown)
- Format code with rustfmt (Rust)

Ensure your code is properly formatted before committing.

## Pull Request Process

### Before Submitting

1. **Update Documentation**: Update relevant documentation if needed
2. **Add Tests**: Add tests for new features or bug fixes
3. **Check Formatting**: Run `pnpm format` and `pnpm format:rust`
4. **Run Linting**: Run `pnpm lint`
5. **Test Your Changes**: Test on both desktop and mobile if applicable

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (if applicable)
- [ ] All tests pass
- [ ] Changes tested on target platform(s)

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How was this tested?

## Screenshots (if applicable)

Add screenshots for UI changes

## Related Issues

Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Testing

### Manual Testing

- **Desktop**: Test on Windows and macOS
- **Mobile**: Test on Android devices (API 28+)
- **Cross-Platform**: Test file transfer between desktop and mobile

### Automated Testing

```bash
# Run tests (when available)
pnpm test

# Run Rust tests
cargo test
```

## Documentation

### Code Documentation

- **TypeScript**: Use JSDoc comments for functions and classes
- **Rust**: Use doc comments (`///`) for public APIs

### Example

```typescript
/**
 * Device discovery hook
 * @param options - Discovery options including device API and default port
 * @returns Discovery state and methods
 */
export function useDiscovery(options: UseDiscoveryOptions) {
  // ...
}
```

```rust
/// Start device discovery service
///
/// # Arguments
/// * `port` - Port number for the service
/// * `state` - Application state
///
/// # Returns
/// Result containing success message or error
pub async fn start_discovery(
    port: u16,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // ...
}
```

### Design Documents

Design documents are located in `.github/design/`. When making significant architectural changes, please update relevant design documents.

## Questions and Support

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: Check [Design Documents](.github/design/README.md) for architecture details

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (BSL 1.1).

---

Thank you for contributing to Stationuli! 🚀
