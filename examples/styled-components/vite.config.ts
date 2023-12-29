import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { cjsInterop } from "vite-plugin-cjs-interop";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		rakkas({ react: { babel: { plugins: ["styled-components"] } } }),
		cjsInterop({ dependencies: ["styled-components"], apply: "both" }),
	],
	optimizeDeps: {
		include: ["styled-components"],
	},
});
