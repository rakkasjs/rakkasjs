import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import { rakkasImage } from "@rakkasjs/image/vite-plugin";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react(),
		rakkas(),
		rakkasImage({ externalUrlPatterns: ["https://ai.peoplebox.biz"] }),
	],
});
