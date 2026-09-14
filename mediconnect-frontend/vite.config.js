import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend base URL. Matches PORT in Backend/.env (default 3000)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Every request the app makes to /api/v1/* is forwarded to the backend
      // server-side, so the browser only ever talks to ONE origin (this dev
      // server). That means cookies (accessToken/refreshToken) work exactly
      // like a same-origin app and the backend needs zero CORS changes.
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
