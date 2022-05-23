import { defineConfig, UserConfig, SSROptions } from "vite";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [
		rakkas({
			react: {
				jsxImportSource: "/src/emotion",
				babel: {
					plugins: ["@emotion/babel-plugin"],
				},
			},
		}),
	],
});
