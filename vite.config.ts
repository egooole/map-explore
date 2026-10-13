import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/map-explore/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        showcase: resolve(__dirname, "showcase/index.html"),
      },
    },
  },
  plugins: [react()],
}));
