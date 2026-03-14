import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/when-can-i-retire/",
  build: {
    outDir: "../../when-can-i-retire",
  },
});
