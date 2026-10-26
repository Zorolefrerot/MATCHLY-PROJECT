import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.shopflow.app',
  appName: 'ShopFlow',
  webDir: 'dist',
  android: {
    backgroundColor: '#F7F9FC',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
