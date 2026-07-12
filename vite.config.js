import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo_shield.png", "icon_manifest.png", "icon_manifest_maskable.png"],
      manifest: {
        name: "Crypta - Secure Password Manager",
        short_name: "Crypta",
        description: "Open-source password manager with military-grade Argon2id encryption. Securely store passwords and encrypted notes.",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icon_manifest.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon_manifest.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icon_manifest_maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icon_manifest_maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    }),
  ],
});
