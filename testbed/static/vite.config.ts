import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [rakkas({ prerender: true })],
});
