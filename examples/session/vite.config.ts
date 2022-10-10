import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig((env) => {
	return {
		build: env.ssrBuild ? { target: "node16" } : undefined,
		plugins: [tsconfigPaths(), rakkas()],
	};
});
