import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import reactSwc from "@vitejs/plugin-react-swc";
import rakkas from "rakkasjs/vite-plugin";

export default defineConfig({
	server: {
		host: "127.0.0.1",
	},
	plugins: [
		process.env.USE_SWC ? reactSwc() : react(),
		rakkas({
			adapter: (process.env.RAKKAS_TARGET as any) || "node",
			prerender: ["/prerender"],
		}),
	],
});
