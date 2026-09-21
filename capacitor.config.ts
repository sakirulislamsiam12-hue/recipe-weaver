import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android (and iOS) wrapper configuration.
 *
 * The app is a server-rendered TanStack Start site, so the native shell loads
 * the hosted site instead of a static bundle. Point `server.url` at the
 * published production URL before building a release for Google Play.
 *
 * `webDir` is only used as an offline fallback page.
 */
const config: CapacitorConfig = {
  appId: "app.smartpantryai.mobile",
  appName: "Smart Pantry AI",
  webDir: "capacitor-webroot",
  server: {
    url: "https://project--6da8f5c0-83a7-41f2-b031-699e72a5ead3.lovable.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#fcfbf8",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
