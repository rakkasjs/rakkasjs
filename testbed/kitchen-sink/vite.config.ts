import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	plugins: [
		rakkas({
			adapter: (process.env.RAKKAS_TARGET as any) || "node",
			prerender: ["/prerender"],
		}),
	],
});
