import { defineConfig } from "vite";
import path from "path";
import speckJsxLoader from "./plugins/vite-speck-jsx-loader.js";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [
    preact(),
    speckJsxLoader(), // ✅ keep your custom loader plugin
  ],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/\.compiled\/.*\.jsx$/,
  },
});
