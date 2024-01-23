import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [react(), rakkas({ prerender: true })],
});
