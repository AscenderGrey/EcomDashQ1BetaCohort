import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "~": "/app/app",
    },
  },
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
});
