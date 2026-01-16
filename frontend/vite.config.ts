import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true,
  },
});
