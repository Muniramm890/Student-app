import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "tech.schooloffice.student",
  appName: "School Office Student",
  webDir: "dist",
  backgroundColor: "#0B0D14", // status bar / system area ke peeche dark theme ka rang
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: "#0B0D14",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
