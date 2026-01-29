# Stationuli Product Requirements Document (PRD)

**Document Version**: 1.0  
**Written Date**: 2025-01-29  
**Project Name**: Stationuli - Personal Workstation P2P File Transfer & Control Solution

---

## I. Document Overview

### 1.1 Document Purpose

This document systematically describes the product requirements for the Stationuli project, including implemented features, features in progress, and features to be implemented, providing a basis for product iteration, development scheduling, and acceptance.

### 1.2 Scope of Application

- Product Managers, Project Managers: Requirement understanding and scheduling
- Development Engineers: Feature implementation and interface design
- Test Engineers: Test case design and acceptance criteria
- Operations and Deployment: Runtime environment and constraints

### 1.3 Terms and Abbreviations

| Term                | Description                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD                 | Product Requirements Document                                                                                                                |
| P2P                 | Peer-to-Peer                                                                                                                                 |
| mDNS                | Multicast DNS, used for local network device discovery                                                                                       |
| Workbench           | Integrated interface for a single device, including file transfer, messaging, control, projection, etc. (currently focused on file transfer) |
| DeviceApi / FileApi | Device and file interface abstractions defined in the common package                                                                         |
| EmptyState          | Guidance page when service is not started, only retaining key operations such as "Start Service"                                             |
| Monorepo            | Single codebase managing multiple packages/applications                                                                                      |

---

## II. Project Overview

### 2.1 Project Background

Stationuli originates from three aspects of needs:

1. **Project Experience Accumulation**: Accumulated practice in cross-device file transfer in offline environments (especially Android → PC).
2. **Personal Real Needs**: As a developer, needing a completely self-controlled, offline-first personal workstation solution.
3. **Technical Exploration**: Practice and validation in Rust ecosystem, cross-platform development, P2P networking, and system integration.

### 2.2 Product Positioning

Stationuli is a **completely self-controlled, completely offline, completely private** personal workstation solution, supporting multi-platform native applications:

- **Desktop**: Tauri + React, supporting Windows, macOS (including Apple Silicon)
- **Mobile**: Tauri + React, supporting Android (iOS planned)

**Core Value**: Using LAN P2P as the communication method, achieving device discovery, file transfer, and subsequent device control and projection capabilities, with no third-party servers, no cloud accounts, and data only transmitted between user devices.

### 2.3 Target Users

- Individual Developers: Need fast, private file and data exchange when collaborating across multiple devices
- Technology Enthusiasts: Want data and connections to be completely self-controlled and usable offline
- Home/Small Teams: Share files and collaborate within LAN without public network or cloud services

---

## III. System Architecture and Technology Stack

### 3.1 Project Structure

```
Stationuli/
├── apps/
│   ├── desktop/          # Desktop application (Tauri + React)
│   └── mobile/            # Mobile application (Tauri + React)
├── packages/
│   ├── common/            # Shared components, Hooks, API abstractions, types, Store for both ends
│   └── core/              # Rust core library (p2p, file, crypto, projection)
├── .github/
│   └── design/            # Design documents, product specifications, etc.
└── Cargo.toml / package.json
```

### 3.2 Technology Stack Overview

| Layer                 | Technology Selection                                 | Description                                                                |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| Frontend Framework    | React 19.x + TypeScript                              | Unified UI and logic                                                       |
| Build Tool            | Vite                                                 | Web resource building                                                      |
| Application Framework | Tauri 2.0                                            | Unified container and system calls for desktop and mobile                  |
| State Management      | Zustand                                              | Lightweight state management                                               |
| Network & Transfer    | Rust (packages/core)                                 | mDNS discovery, TCP connection, file chunking and transfer                 |
| Security              | X25519 + AES-256                                     | End-to-end encryption (design declared, implementation depends on version) |
| Engineering & Quality | pnpm workspace, Vitest, Husky, Prettier, lint-staged | Build, test, format, commit checks                                         |

### 3.3 Capability Boundaries for Both Ends

| Capability                                             | Desktop              | Mobile                                 |
| ------------------------------------------------------ | -------------------- | -------------------------------------- |
| Service start/stop (mDNS + TCP listening)              | ✅                   | ✅                                     |
| Local info display (IP, port, device ID)               | ✅                   | ✅                                     |
| mDNS device discovery                                  | ✅                   | ✅                                     |
| Manual add/edit/delete devices                         | ✅                   | ✅                                     |
| Device list search and filter                          | ✅                   | ✅                                     |
| Test connection                                        | ✅                   | ✅                                     |
| Select and send files (multiple selection)             | ✅                   | ✅ (including content URI)             |
| Receive file list and save/delete                      | ✅                   | ✅                                     |
| Transfer progress and completion/receive notifications | ✅                   | ✅                                     |
| Workbench (open by device + file transfer)             | ✅                   | ✅                                     |
| Home / Device / History / Settings pages               | ✅                   | ✅ (History/Settings are placeholders) |
| Operation logs / Transfer history                      | ❌ To be implemented | ❌ To be implemented                   |
| Text messaging in workbench                            | ⏳ Planned           | ⏳ Planned                             |
| Device projection / Device control / Clipboard sync    | ⏳ Planned           | ⏳ Planned                             |
| Resume transfer, sender info display optimization      | ⏳ Planned           | ⏳ Planned                             |

---

## IV. Functional Requirements

### 4.1 Service and Discovery (Implemented)

**Requirement Overview**: Users can start/stop local P2P service (mDNS + TCP listening), view local information, and manage device lists through mDNS automatic discovery or manual addition.

#### 4.1.1 Feature Points

| ID          | Requirement Description                                                               | Priority | Implementation Status | Applicable End   |
| ----------- | ------------------------------------------------------------------------------------- | -------- | --------------------- | ---------------- |
| F-DISCO-001 | Support starting service: register mDNS, start TCP listening, start file receive task | P0       | ✅                    | Desktop / Mobile |
| F-DISCO-002 | Support stopping service: stop mDNS, release TCP listening, end receive task          | P0       | ✅                    | Desktop / Mobile |
| F-DISCO-003 | Display local IP, port, device ID, and support copying                                | P0       | ✅                    | Desktop / Mobile |
| F-DISCO-004 | Automatically discover devices in LAN through mDNS and refresh list                   | P0       | ✅                    | Desktop / Mobile |
| F-DISCO-005 | Support manually adding devices (name, type, ID, IP, port), write to device list      | P0       | ✅                    | Desktop / Mobile |
| F-DISCO-006 | Show loading state during service start/stop, debounce and timeout protection         | P1       | ✅                    | Desktop / Mobile |
| F-DISCO-007 | Show EmptyState when service is not started, only retain "Start Service" entry        | P1       | ✅                    | Desktop / Mobile |

#### 4.1.2 Business Rules

- Default service port is 8080 (configurable), consistent with TCP listening port.
- Device types include desktop, mobile, unknown; report according to local type when registering mDNS.
- Sensitive information (such as local IP, device ID) is only used for local display and P2P communication, not uploaded to third parties.

---

### 4.2 Device Management (Implemented)

**Requirement Overview**: Display discovered devices in a list, search and filter, test connections, edit and delete, and provide operation entries such as "File Transfer" and "Workbench".

#### 4.2.1 Feature Points

| ID        | Requirement Description                                                                       | Priority | Implementation Status | Applicable End   |
| --------- | --------------------------------------------------------------------------------------------- | -------- | --------------------- | ---------------- |
| F-DEV-001 | Display devices in card form (name, address, port, type)                                      | P0       | ✅                    | Desktop / Mobile |
| F-DEV-002 | Support searching devices by name and address                                                 | P0       | ✅                    | Desktop / Mobile |
| F-DEV-003 | Support filtering by all/online/offline (current logic can be uniformly considered as online) | P1       | ✅                    | Desktop / Mobile |
| F-DEV-004 | Support initiating "Test Connection" for specified device and provide success/failure prompt  | P0       | ✅                    | Desktop / Mobile |
| F-DEV-005 | Support editing device information (name, type, address, port, etc.)                          | P0       | ✅                    | Desktop / Mobile |
| F-DEV-006 | Support deleting devices                                                                      | P0       | ✅                    | Desktop / Mobile |
| F-DEV-007 | Each device provides "File Transfer" and "Workbench" entries                                  | P0       | ✅                    | Desktop / Mobile |
| F-DEV-008 | Show empty state and "Add Device" guidance when device list is empty                          | P1       | ✅                    | Desktop / Mobile |

#### 4.2.2 Business Rules

- Test connection is determined by TCP connection to target address:port, timeout and errors need clear prompts.
- When manually adding devices, IP and port are required, name/type/ID are optional.

---

### 4.3 File Transfer (Implemented)

**Requirement Overview**: Users can select files to send to specified devices, receiving end automatically saves to disk and displays in "Received Files" list, supporting save-as and delete; sending and receiving processes have progress and event notifications.

#### 4.3.1 Sending

| ID         | Requirement Description                                                                           | Priority | Implementation Status | Applicable End   |
| ---------- | ------------------------------------------------------------------------------------------------- | -------- | --------------------- | ---------------- |
| F-FILE-S01 | Desktop selects files through system dialog, supports multiple selection                          | P0       | ✅                    | Desktop          |
| F-FILE-S02 | Mobile selects files through system file picker or content URI and sends                          | P0       | ✅                    | Mobile           |
| F-FILE-S03 | Initiate single/multiple file sending to specified device's address:port                          | P0       | ✅                    | Desktop / Mobile |
| F-FILE-S04 | Large files transferred in chunks (e.g., 1MB), protocol includes StartTransfer / Chunk / Complete | P0       | ✅                    | Desktop / Mobile |
| F-FILE-S05 | Sending process can report progress (e.g., transfer-progress, transfer-complete events)           | P1       | ✅                    | Desktop / Mobile |

#### 4.3.2 Receiving

| ID         | Requirement Description                                                                          | Priority | Implementation Status | Applicable End   |
| ---------- | ------------------------------------------------------------------------------------------------ | -------- | --------------------- | ---------------- |
| F-FILE-R01 | Continuously listen to TCP when service is enabled, receive and parse transfer protocol messages | P0       | ✅                    | Desktop / Mobile |
| F-FILE-R02 | Save received files to application data directory (e.g., received_files)                         | P0       | ✅                    | Desktop / Mobile |
| F-FILE-R03 | Send file-received event to frontend after receiving completes (including file_path, file_name)  | P0       | ✅                    | Desktop / Mobile |
| F-FILE-R04 | Display file name, path, size, receive time, etc. in "Received Files" area                       | P0       | ✅                    | Desktop / Mobile |
| F-FILE-R05 | Support saving received files to user-specified location                                         | P0       | ✅                    | Desktop / Mobile |
| F-FILE-R06 | Support deleting received file records from list                                                 | P1       | ✅                    | Desktop / Mobile |
| F-FILE-R07 | Support viewing single received file details in popup                                            | P1       | ✅                    | Desktop / Mobile |

#### 4.3.3 Business Rules

- Transfer protocol: TCP + custom binary protocol, message order is StartTransfer → Chunk×N → Complete.
- Desktop uses local file paths; Android can use content URI, requires persistent permissions and compliant reading.
- Received files are saved by default in application data directory under received_files, strategy for non-overwriting same-name files depends on implementation.

---

### 4.4 Workbench (Main Body Implemented)

**Requirement Overview**: After users enter "Workbench" from device card, open a dedicated interface for that device; currently supports selecting and sending files within workbench, reserves tabs for "Device Control", "Messaging", "Screen Sharing", etc.

#### 4.4.1 Feature Points

| ID       | Requirement Description                                                                       | Priority | Implementation Status                    | Applicable End   |
| -------- | --------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- | ---------------- |
| F-WS-001 | Click "Workbench" from device card to open workbench interface for that device                | P0       | ✅                                       | Desktop / Mobile |
| F-WS-002 | Support selecting files within workbench and sending to current device                        | P0       | ✅                                       | Desktop / Mobile |
| F-WS-003 | Workbench provides close/return entry, returns to device list or previous level after closing | P0       | ✅                                       | Desktop / Mobile |
| F-WS-004 | Reserve tab structure for "File Transfer / Device Control / Messaging / Screen Sharing"       | P1       | ✅ (structure exists, some placeholders) | Desktop / Mobile |
| F-WS-005 | Text messaging send/receive within workbench                                                  | P0       | ⏳ Planned                               | Desktop / Mobile |
| F-WS-006 | Device projection (screen mirroring) within workbench                                         | P1       | ⏳ Planned                               | Desktop / Mobile |
| F-WS-007 | Device control (keyboard/mouse, clipboard, etc.) within workbench                             | P1       | ⏳ Planned                               | Desktop / Mobile |

#### 4.4.2 Business Rules

- Workbench is bound to a single device, entry is that device's address, port, etc.; does not maintain long connection state after closing (as per current implementation).
- For future extensions, messaging, projection, control, etc. are all presented within the same "Workbench" through tabs or blocks.

---

### 4.5 Application Framework and Pages (Implemented)

**Requirement Overview**: Provide unified layout, routing, and page structure, desktop uses sidebar + top bar, mobile uses bottom bar + top bar; includes home page, device page, history page, settings page.

#### 4.5.1 Feature Points

| ID        | Requirement Description                                                                                              | Priority | Implementation Status                                         | Applicable End   |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- | ---------------- |
| F-APP-001 | Desktop main layout: left sidebar navigation + top bar (including service status and start/stop) + main content area | P0       | ✅                                                            | Desktop          |
| F-APP-002 | Mobile main layout: bottom navigation bar + top bar + main content area                                              | P0       | ✅                                                            | Mobile           |
| F-APP-003 | Routes include home(/home), devices(/devices), history(/history), settings(/settings)                                | P0       | ✅                                                            | Desktop / Mobile |
| F-APP-004 | Home page shows "Received Files" when service is started, guides to start service when not started                   | P0       | ✅                                                            | Desktop / Mobile |
| F-APP-005 | Device page carries device management, search filter, add device popup, workbench entry                              | P0       | ✅                                                            | Desktop / Mobile |
| F-APP-006 | History page reserves "Transfer History" and "Device History" blocks, specific features to be implemented            | P1       | ⏳ Placeholder                                                | Desktop / Mobile |
| F-APP-007 | Settings page reserves "Application Configuration" block, "About" shows app name, version, description               | P1       | ✅ (About implemented) / ⏳ (Configuration to be implemented) | Desktop / Mobile |
| F-APP-008 | Top bar or equivalent area shows service status (running/stopped) and start/stop button                              | P0       | ✅                                                            | Desktop / Mobile |

#### 4.5.2 Business Rules

- When service is not started, EmptyState only retains "Start Service"; automatically enters main interface after successful start.
- After service stops, still stays on main interface, does not force return to EmptyState.

---

### 4.6 Shared Layer and Infrastructure (Implemented)

**Requirement Overview**: Through packages/common, provide API abstractions, Hooks, UI components, state management, and type definitions shared by both ends, ensuring Desktop and Mobile can reuse and maintain business logic and experience.

#### 4.6.1 Feature Points

| ID          | Requirement Description                                                                             | Priority | Implementation Status | Applicable End |
| ----------- | --------------------------------------------------------------------------------------------------- | -------- | --------------------- | -------------- |
| F-SHARE-001 | Define DeviceApi (startDiscovery, stopDiscovery, getDevices, addDevice, testConnection, etc.)       | P0       | ✅                    | common         |
| F-SHARE-002 | Define FileApi (selectFile, getFileName, getFileSize, sendFile, saveReceivedFile, etc.)             | P0       | ✅                    | common         |
| F-SHARE-003 | Provide useDiscovery / useDeviceDiscovery and other device discovery related Hooks                  | P0       | ✅                    | common         |
| F-SHARE-004 | Provide useFileTransfer and other file transfer related Hooks                                       | P0       | ✅                    | common         |
| F-SHARE-005 | Provide shared components such as ServiceStatusCard, DeviceCard, AddDeviceDialog, ReceivedFilesCard | P0       | ✅                    | common         |
| F-SHARE-006 | Provide Zustand Store or equivalent state management for devices and file transfer                  | P0       | ✅                    | apps + common  |
| F-SHARE-007 | Provide shared type definitions such as DeviceInfo, ReceivedFile                                    | P0       | ✅                    | common         |

#### 4.6.2 Business Rules

- Each end implements DeviceApi and FileApi through Adapter (e.g., Tauri invoke calls backend), UI distinguishes styles and layouts through variant (desktop/mobile).
- When adding cross-end capabilities, prioritize supplementing types and interfaces in common, then implement in each end.

---

### 4.7 Core Library (Rust, Implemented)

**Requirement Overview**: packages/core provides underlying capabilities such as mDNS discovery, TCP connection, file chunking and transfer, encryption and projection, called by Desktop and Mobile Tauri backends.

| ID         | Requirement Description                                                                              | Priority | Implementation Status                                                         | Notes                     |
| ---------- | ---------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------------- |
| F-CORE-001 | mDNS service registration and discovery, maintain device list (id, name, address, port, device_type) | P0       | ✅                                                                            | p2p/mdns                  |
| F-CORE-002 | TCP listening and connection, used for file transfer and test connection                             | P0       | ✅                                                                            | p2p/tcp                   |
| F-CORE-003 | File chunking (Chunk), transfer protocol (StartTransfer/Chunk/Complete) and reassembly               | P0       | ✅                                                                            | file/chunk, file/transfer |
| F-CORE-004 | Resume transfer related data structures and logic (resume)                                           | P1       | ✅ (structure exists) / ⏳ (end-to-end not fully connected)                   | file/resume               |
| F-CORE-005 | Encryption and key exchange (X25519, AES-256) for transport layer use                                | P1       | ✅ (module exists) / ⏳ (integration with transport layer depends on version) | crypto                    |
| F-CORE-006 | Projection/capture and streaming (projection), application layer not yet used                        | P2       | ✅ (module exists)                                                            | projection                |

---

### 4.8 Transfer History and Operation Logs (To be Implemented)

**Requirement Overview**: Record and display file transfer history and key operations for review and statistics.

| ID         | Requirement Description                                                          | Priority | Implementation Status | Applicable End   |
| ---------- | -------------------------------------------------------------------------------- | -------- | --------------------- | ---------------- |
| F-HIST-001 | Record each sent/received file, target device, time, result, etc.                | P1       | ⏳ To be implemented  | Desktop / Mobile |
| F-HIST-002 | Provide "Transfer History" list and filter in history page                       | P1       | ⏳ To be implemented  | Desktop / Mobile |
| F-HIST-003 | Record device add/delete/edit, service start/stop operations and support viewing | P2       | ⏳ To be implemented  | Desktop / Mobile |

---

### 4.9 File Transfer Enhancements (Planned)

**Requirement Overview**: On the basis of existing single/multiple selection sending, enhance queue management, progress display, resume transfer, and receiving side experience.

| ID         | Requirement Description                                                        | Priority | Implementation Status  | Applicable End   |
| ---------- | ------------------------------------------------------------------------------ | -------- | ---------------------- | ---------------- |
| F-FILE-E01 | Multi-file sending queue management, support cancel and retry                  | P1       | ⏳ To be implemented   | Desktop / Mobile |
| F-FILE-E02 | Display progress bar, speed, estimated remaining time during send/receive      | P1       | ⏳ To be implemented   | Desktop / Mobile |
| F-FILE-E03 | Resume transfer for large files                                                | P1       | ⏳ To be implemented   | Desktop / Mobile |
| F-FILE-E04 | Display sender information (device name, IP, type, etc.) in received file list | P1       | ⏳ To be implemented   | Desktop / Mobile |
| F-FILE-E05 | Received file preview (e.g., image preview)                                    | P2       | ⏳ To be implemented   | Desktop / Mobile |
| F-FILE-E06 | Complete redesign of Android side content URI and streaming transfer           | P1       | ⏳ See design document | Mobile           |

---

## V. Non-Functional Requirements

### 5.1 Performance

| ID         | Requirement Description                                                                                   | Notes                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| NF-PERF-01 | Devices should appear in discovery list within seconds in typical home/office LAN                         | mDNS and polling interval need to balance refresh frequency and load |
| NF-PERF-02 | Large file transfer uses chunking mechanism to avoid OOM from single full file load                       | Current default 1MB chunks, see packages/core/file                   |
| NF-PERF-03 | Operations such as start/stop service, test connection, send files need loading state and result feedback | Disable buttons, Progress, Toast/Alert, etc.                         |

### 5.2 Security and Privacy

| ID        | Requirement Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| NF-SEC-01 | End-to-end encryption uses X25519 + AES-256, data does not pass through third-party servers (design declared, implementation depends on version) |
| NF-SEC-02 | Discovery and transfer only occur in user-controlled LAN and local machine, no cloud accounts or data retention                                  |
| NF-SEC-03 | Local IP, device ID, Token, etc. are only used locally and for P2P, not uploaded to non-user-specified services                                  |

### 5.3 Compatibility

| ID           | Requirement Description                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| NF-COMPAT-01 | Desktop: Windows 10+ x64; macOS Big Sur+ (x64/Apple Silicon)                                 |
| NF-COMPAT-02 | Mobile: Android 9.0+ (API 28+), ARM64/ARMv7; iOS TBD                                         |
| NF-COMPAT-03 | All capabilities depend on both ends installing native clients, pure Web usage not supported |

### 5.4 Usability and Maintainability

| ID          | Requirement Description                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NF-USAB-01  | Key operations have clear feedback (success/failure prompts, loading state), error messages are easy for users to understand and troubleshoot                 |
| NF-MAINT-01 | Common logic and UI are deposited in packages/common, both ends reuse through DeviceApi/FileApi and variant                                                   |
| NF-MAINT-02 | Within the same major version, Desktop and Mobile maintain consistency in "device discovery + file transfer" protocol and behavior to ensure interoperability |

---

## VI. Relationship with Third-Party Services

Stationuli **does not depend on any third-party business services**: device discovery and file transfer are completed within LAN through mDNS and TCP, with no central server or cloud accounts. If "optional backend" (such as relay, account system) is added in the future, integration requirements and capability boundaries need to be separately supplemented in this PRD.

---

## VII. Requirement Priority Explanation

- **P0**: Core processes, product unusable or value significantly impaired without them.
- **P1**: Important features, affecting experience and differentiation.
- **P2**: Enhancement features, can be iterated later.

---

## VIII. Appendix

### 8.1 Related Documents

- [Project README](https://github.com/trueLoving/Stationuli/blob/main/README.md)
- [Common Package](https://github.com/trueLoving/Stationuli/tree/main/packages/common)
- [Core Library](https://github.com/trueLoving/Stationuli/tree/main/packages/core/)

### 8.2 Revision History

| Version | Date       | Change Description                                                                                                                      | Author |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.0     | 2025-01-29 | Rewritten according to Pixuli PRD format, supplemented with IDs, priorities, implementation status, applicable ends, and business rules | —      |

---

_This document is updated with project iterations, please refer to code and latest design documents._
