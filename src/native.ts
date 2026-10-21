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

// ── Push notifications (FCM) ──
let pushToken: string | null = null;

// login ke baad: permission -> token -> backend ko batao. Tap par 'open-chat' event (AppShell sunta hai).
export const registerPush = async (sendToken: (t: string) => Promise<unknown>) => {
  if (!isNative) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;

    await PushNotifications.createChannel({ id: "chat", name: "Messages", description: "School messages and replies", importance: 4, visibility: 1, vibration: true }).catch(() => {});
    await PushNotifications.removeAllListeners(); // dobara login par duplicate listeners na bane
    PushNotifications.addListener("registration", async (t) => {
      pushToken = t.value;
      try { await sendToken(t.value); } catch (e: any) { console.warn("push register failed", e?.message); }
    });
    PushNotifications.addListener("registrationError", (e) => console.warn("push registration error", e));
    PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
      const d: any = a?.notification?.data || {};
      if (d.type === "chat") window.dispatchEvent(new CustomEvent("open-chat", { detail: d }));
    });
    await PushNotifications.register();
  } catch (e: any) { console.warn("push setup failed", e?.message); }
};

// logout: is phone par is student ko push band (call PEHLE, token clear hone se pehle)
export const unregisterPush = (removeToken: (t: string) => Promise<unknown>) => {
  if (!isNative || !pushToken) return Promise.resolve();
  const t = pushToken;
  pushToken = null;
  return removeToken(t).catch(() => {});
};
