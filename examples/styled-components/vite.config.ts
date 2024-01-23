import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import rakkas from "rakkasjs/vite-plugin";
import { cjsInterop } from "vite-plugin-cjs-interop";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		react({ babel: { plugins: ["styled-components"] } }),
		rakkas(),
		cjsInterop({ dependencies: ["styled-components"] }),
	],
	optimizeDeps: {
		include: ["styled-components"],
	},
});
