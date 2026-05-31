import type { CapacitorConfig } from '@capacitor/cli';

/** Permanent GEserverhub public hub (ngrok → port 3005 on GE-SERVER). */
const DEFAULT_SERVER_URL = 'https://strong-dory-enabled.ngrok-free.app';

/**
 * Play Store build loads live Cargo portal from the hub.
 * Override: CAPACITOR_SERVER_URL=https://other-host
 * Bundled offline placeholder: CAPACITOR_USE_BUNDLED=1
 */
const useBundled = process.env.CAPACITOR_USE_BUNDLED === '1';
const baseUrl = useBundled
  ? undefined
  : (process.env.CAPACITOR_SERVER_URL ?? DEFAULT_SERVER_URL).replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'com.cargothaikorea.myapp',
  appName: 'ไทย-เกาหลี คาโก้',
  webDir: 'www',
  ...(baseUrl
    ? {
        server: {
          url: `${baseUrl}/cargo/track?mobileApp=1`,
          cleartext: baseUrl.startsWith('http://'),
          androidScheme: baseUrl.startsWith('https') ? 'https' : 'http',
          ...(baseUrl.includes('ngrok')
            ? { headers: { 'ngrok-skip-browser-warning': '1' } }
            : {}),
        },
      }
    : {}),
  android: {
    allowMixedContent: false,
    backgroundColor: '#16181f',
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEY_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEY_ALIAS_PASSWORD,
      releaseType: 'AAB',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#16181f',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#16181f',
    },
  },
};

export default config;
