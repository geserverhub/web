/** True when running inside the Cargo Capacitor Android/iOS shell. */
export function isCargoMobileApp() {
  if (typeof window === 'undefined') return false;

  if (window.Capacitor?.isNativePlatform?.()) return true;

  try {
    return new URLSearchParams(window.location.search).get('mobileApp') === '1';
  } catch {
    return false;
  }
}

export const CARGO_MOBILE_APP_NAME = 'ไทย-เกาหลี คาโก้';
export const CARGO_HUB_NAME = 'GE SERVER HUB';
