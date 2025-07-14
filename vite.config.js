import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  base: "./", // important pour Electron
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "fs",
        "path",
        "util",
        "os",
        "crypto",
        "events",
        "assert",
        "process",
      ],
    },
  },
  publicDir: false, // retire si tu utilises un dossier public
  plugins: [react()],
  resolve: {
    alias: {
      fs: false,
      path: false,
      util: false,
      os: false,
      crypto: false,
      events: false,
      assert: false,
      process: false,
    },
  },
});
