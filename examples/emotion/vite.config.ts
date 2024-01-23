import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: "/src/emotion",
			babel: {
				plugins: ["@emotion/babel-plugin"],
			},
		}),
		rakkas(),
	],
	ssr: {
		// This is required to fix ESM/CJS incompatibilities
		noExternal: ["@emotion/styled"],
	},
});
