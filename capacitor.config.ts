import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ninipro.app',
  appName: 'NiniPro',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
