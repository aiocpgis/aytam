import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/aytam/",
  plugins: [
    react(),
    VitePWA({
      // "prompt" → يسأل المستخدم قبل التحديث بدلاً من التحديث الصامت في الخلفية
      // هذا يضمن أن الجوال يحصل على النسخة الجديدة فوراً عند كل نشر
      registerType: "prompt",
      base: "/aytam/",
      scope: "/aytam/",
      devOptions: {
        enabled: false,
      },
      // استراتيجية الشبكة أولاً لملفات HTML — يضمن دائماً الحصول على أحدث نسخة
      workbox: {
        // لا تخزّن index.html مؤقتاً — اطلبه من الشبكة دائماً
        navigationPreload: true,
        runtimeCaching: [
          {
            // HTML navigation requests — network first (always fresh)
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "rifq-navigation",
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  cacheWillUpdate: async () => null, // لا تخزّن navigation
                },
              ],
            },
          },
          {
            // JS/CSS assets مع hash في الاسم — آمن للتخزين طويل المدى
            urlPattern: /\/aytam\/assets\//,
            handler: "CacheFirst",
            options: {
              cacheName: "rifq-assets",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // أسبوع واحد
              },
            },
          },
          {
            // Supabase API — شبكة أولاً دائماً، لا تخزين
            urlPattern: /supabase\.co/,
            handler: "NetworkOnly",
          },
        ],
        // أوقف التخزين المؤقت لـ index.html تماماً
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
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