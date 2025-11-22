//! FFI 接口模块
//!
//! 提供与其他语言交互的 FFI 接口

#[cfg(target_os = "android")]
pub mod jni;
