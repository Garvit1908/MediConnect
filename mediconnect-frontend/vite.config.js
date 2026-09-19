import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {

      "/api/v1": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("[vite proxy error]", err.message);
          });
        },
      },
      "/socket.io": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api/v1": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
