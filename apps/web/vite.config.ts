import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["img/hero-pro.jpg", "img/einstein-pro.jpg", "audio/bemvindo.mp3"],
      manifest: {
        name: "PHC Trainer Pro — Formação · Gestão Cegid PHC Evolution",
        short_name: "PHC Trainer",
        description:
          "Formação prática multiutilizador para dominar o módulo Gestão do Cegid PHC Evolution: 90 missões, tutor de IA, flashcards SRS e progresso de equipa.",
        lang: "pt-BR",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        background_color: "#0d1220",
        theme_color: "#f5a623",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // offline-first para o shell; API nunca é servida de cache (dados por utilizador)
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,mp3,woff2,md,csv}"],
        globIgnores: ["**/og.png"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/index.html",
        // não tentar fazer fallback de pedidos /api para o index.html
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // imagens/áudio: cache-first
            urlPattern: ({ request }) => ["image", "audio"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "phc-media",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  server: {
    port: 5173,
    proxy: {
      // em dev, a API corre em :4000 — proxy evita CORS e cookies cross-origin
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1200,
  },
});
