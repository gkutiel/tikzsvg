import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
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
