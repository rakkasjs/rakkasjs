import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	server: {
		host: "127.0.0.1",
	},
	plugins: [
		rakkas({
			adapter: (process.env.RAKKAS_TARGET as any) || "node",
			prerender: ["/prerender"],
		}),
	],
});
