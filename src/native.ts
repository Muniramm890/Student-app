// Capacitor (Android) glue. Web/PWA par kuch nahi karta: sab kuch isNativePlatform() se guarded hai.
import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

// status bar ke icons theme ke hisaab se (dark theme -> light icons)
export const setNativeTheme = async (mode: "light" | "dark") => {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: mode === "dark" ? Style.Dark : Style.Light });
  } catch { /* plugin unavailable */ }
};

export const initNative = async () => {
  if (!isNative) return;
  document.documentElement.classList.add("is-native", `is-${Capacitor.getPlatform()}`);

  // App ke andar PWA service worker ki zarurat nahi (files APK me hain) — purani cache se stale version na dikhe
  try {
    if ("serviceWorker" in navigator) {
      (await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister());
    }
    if ("caches" in window) (await caches.keys()).forEach((k) => caches.delete(k));
  } catch { /* ignore */ }

  let theme: "light" | "dark" = "dark";
  try { theme = localStorage.getItem("student_theme_mode") === "light" ? "light" : "dark"; } catch { /* ignore */ }
  setNativeTheme(theme);

  try {
    const { App } = await import("@capacitor/app");
    // Android back: 1) khula modal/sheet band  2) router history me peeche  3) app minimize
    App.addListener("backButton", () => {
      const open = document.querySelectorAll<HTMLElement>("[data-native-back]");
      if (open.length) { open[open.length - 1].click(); return; }
      const idx = window.history.state && typeof window.history.state.idx === "number" ? window.history.state.idx : 0;
      if (idx > 0) window.history.back();
      else App.minimizeApp();
    });
  } catch { /* ignore */ }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch { /* ignore */ }
};
