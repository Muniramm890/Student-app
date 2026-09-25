// FILE: student-app/vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Student App — mobile-first PWA, full-screen desktop support.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "School Office — Student",
        short_name: "School Office",
        description: "Your school, in your pocket — attendance, fees, results & more.",
        theme_color: "#E8600A",
        background_color: "#0F1117",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "https://waapi-h6e7b5g9cmfthkhn.centralindia-01.azurewebsites.net",
        changeOrigin: true,
      },
    },
  },
});
