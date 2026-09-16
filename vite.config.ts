import { defineConfig } from "vite";
export default defineConfig({
  root: "web",
  build: { outDir: "../dist/ui", emptyOutDir: true },
});
