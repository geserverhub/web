import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Play Store build — set before `npm run cap:sync`:
 *   CAPACITOR_SERVER_URL=https://YOUR-PUBLIC-HOST
 * (no trailing slash; app opens /customer-dashboard-login)
 *
 * Omit CAPACITOR_SERVER_URL to use bundled www/ (offline placeholder only).
 */
const baseUrl = process.env.CAPACITOR_SERVER_URL?.replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'com.geserverhub.momogespace',
  appName: 'Momoge space',
  webDir: 'www',
  ...(baseUrl
    ? {
        server: {
          url: `${baseUrl}/customer-dashboard-login`,
          cleartext: baseUrl.startsWith('http://'),
          androidScheme: baseUrl.startsWith('https') ? 'https' : 'http',
        },
      }
    : {}),
  android: {
    allowMixedContent: false,
    backgroundColor: '#047857',
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
      backgroundColor: '#047857',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#047857',
    },
  },
};

export default config;
