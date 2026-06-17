export function detectDeviceAndOS() {
  const userAgent = navigator.userAgent;
  let deviceType = "Desktop"; // Default to desktop
  let os = "Unknown OS";

  // Device Type Detection
  if (/mobile/i.test(userAgent)) {
    deviceType = "Mobile";
  } else if (
    /tablet/i.test(userAgent) ||
    /ipad|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(userAgent)
  ) {
    deviceType = "Tablet";
  }

  // Operating System Detection
  if (/windows nt/i.test(userAgent)) {
    os = "Windows";
  } else if (/mac os/i.test(userAgent)) {
    os = "MacOS";
  } else if (/android/i.test(userAgent)) {
    os = "Android";
  } else if (/ios|iphone|ipad|ipod/i.test(userAgent)) {
    os = "iOS";
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
  }

  return { deviceType, os };
}
