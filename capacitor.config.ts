import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.redeconomix.negocios',
  appName: 'RedEconomiX Negocios',
  webDir: 'out',
  backgroundColor: '#D60000',
  server: {
    url: 'https://redeconomix-negocios-h6p3.vercel.app',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#C00000'
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#D60000",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;
