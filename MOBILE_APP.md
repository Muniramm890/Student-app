# School Office Student — Android app (Capacitor)

Same React code = web/PWA + Android app. Web par kuch nahi badla (native code `Capacitor.isNativePlatform()` se guarded hai).

## Phone se APK lena (PC ki zarurat nahi)
GitHub repo -> **Releases** -> "Android APK (latest)" -> `SchoolOffice-Student.apk` download karke install karo
("Install unknown apps" allow karna padega). Code (`src/`, `android/`...) main par push hote hi APK apne aap ban jata hai.
Naya APK purane app ke upar update ho jata hai (same signing key).

## PC par build karna ho to
1. Android Studio install karo, `npm install`
2. `npm run android` (web build -> sync -> Android Studio khulta hai) -> Run

## Notes
- `appId`: `tech.schooloffice.student` (`capacitor.config.ts`). Play Store ke liye alag upload key banani hogi (sideload key sirf direct install ke liye).
- Icon/splash sources: `assets/*.svg`  ->  `npx @capacitor/assets generate --android`
- API URL: `VITE_API_BASE_URL` (default `src/api/client.ts`). Backend CORS me app ke origins allowed hain.
- `.npmrc` me `legacy-peer-deps=true` hai (vite-plugin-pwa ka peer-dependency conflict).
- Abhi nahi hai: push notifications (app band hone par alert), iOS.
