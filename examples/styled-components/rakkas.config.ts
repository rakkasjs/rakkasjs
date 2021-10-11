import { defineConfig } from "@rakkasjs/cli";

export default defineConfig({
	vite: {
		optimizeDeps: { include: ["styled-components"] },
	},
	babel: {
		plugins: ["babel-plugin-styled-components"],
	},
});
