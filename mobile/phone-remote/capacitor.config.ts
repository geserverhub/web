import type { CapacitorConfig } from '@capacitor/cli';

/** Permanent GEserverhub public hub (ngrok → port 3005 on GE-SERVER). */
const DEFAULT_SERVER_URL = 'https://strong-dory-enabled.ngrok-free.app';

/**
 * Loads live Phone Remote web UI from the hub.
 * Override: CAPACITOR_SERVER_URL=https://other-host
 * Bundled offline placeholder: CAPACITOR_USE_BUNDLED=1
 */
const useBundled = process.env.CAPACITOR_USE_BUNDLED === '1';
const baseUrl = useBundled
  ? undefined
  : (process.env.CAPACITOR_SERVER_URL ?? DEFAULT_SERVER_URL).replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'phoneremote.myapp',
  appName: 'Phone Remote',
  webDir: 'www',
  ...(baseUrl
    ? {
        server: {
          url: `${baseUrl}/phone-remote?mobileApp=1`,
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
    backgroundColor: '#1e3a5f',
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
      backgroundColor: '#1e3a5f',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e3a5f',
    },
  },
};

export default config;
