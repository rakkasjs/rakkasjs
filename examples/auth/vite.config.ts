import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	ssr: {
		external: ["@auth/core", "rakkasjs/node-adapter"],
	},
	plugins: [tsconfigPaths(), react(), rakkas()],
});
