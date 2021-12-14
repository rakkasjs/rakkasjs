import { defineConfig } from "@rakkasjs/cli";

export default defineConfig({
	babel: {
		plugins: ["babel-plugin-styled-components"],
	},
	vite: {
		optimizeDeps: {
			include: ["styled-components"],
		},
	},
});
