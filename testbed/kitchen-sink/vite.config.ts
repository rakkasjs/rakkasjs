import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig((env) => ({
	plugins: [
		rakkas({
			adapter: (process.env.RAKKAS_TARGET as any) || "node",
			prerender: ["/prerender"],
			filterRoutes(path) {
				if (path.startsWith("no-js/")) {
					return "server";
				} else if (path.startsWith("dev-only/")) {
					return env.command === "serve";
				} else {
					return true;
				}
			},
		}),
	],
}));
