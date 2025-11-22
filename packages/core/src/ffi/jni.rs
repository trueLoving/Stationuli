//! JNI 绑定（用于 Android Native Module）

use jni::JNIEnv;
use jni::objects::{JClass, JString};
use jni::sys::{jboolean, jstring};

/// 开始 mDNS 设备发现
#[no_mangle]
pub extern "system" fn Java_com_stationuli_StationuliModule_startMdnsDiscovery(
  env: JNIEnv,
  _class: JClass,
) -> jstring {
  // TODO: 实现 mDNS 发现
  let result = "[]";
  let output = env.new_string(result).unwrap();
  output.into_raw()
}

/// 连接到设备
#[no_mangle]
pub extern "system" fn Java_com_stationuli_StationuliModule_connectToDevice(
  env: JNIEnv,
  _class: JClass,
  device_id: JString,
) -> jboolean {
  let device_id: String = env
    .get_string(device_id)
    .expect("Couldn't get java string!")
    .into();

  // TODO: 实现设备连接
  true as jboolean
}
