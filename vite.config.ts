import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/aytam/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      base: "/aytam/",
      scope: "/aytam/",
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "منصة رِفْق لرعاية الأيتام",
        short_name: "رِفْق",
        description: "نظام الإشراف الشامل وإدارة كفالات الأبناء",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/aytam/",
        scope: "/aytam/",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
        ],
      },
    }),
  ],
});