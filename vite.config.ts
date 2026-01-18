import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "tikzsvg.es.js",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
    },
  },
})
