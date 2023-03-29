import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig((env) => {
	return {
		plugins: [tsconfigPaths(), rakkas()],
	};
});
