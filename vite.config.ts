import { defineConfig } from "vite";
import { editorApi } from "./editor-plugin.ts";

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [editorApi()],
});
