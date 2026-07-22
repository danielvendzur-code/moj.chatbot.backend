import type { UserConfig } from "vite";

/*
 * Build vložiteľného widgetu: dist/widget.js + dist/widget.css.
 * Beží po hlavnom builde (emptyOutDir: false), takže Pages nesie
 * demo stránku aj embed súbory z jedného priečinka.
 */
const config: UserConfig = {
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/embed.tsx",
      name: "DVAssistant",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "widget.css" : "assets/[name][extname]",
      },
    },
  },
};

export default config;
