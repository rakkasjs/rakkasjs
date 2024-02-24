import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";
import react from "@vitejs/plugin-react";
import reactSwc from "@vitejs/plugin-react-swc";
import rakkas from "rakkasjs/vite-plugin";
import { rakkasCss } from "@rakkasjs/css/vite-plugin";

export default defineConfig({
	server: {
		host: "127.0.0.1",
	},
	plugins: [
		inspect(),
		process.env.USE_SWC ? reactSwc() : react(),
		rakkasCss(),
		rakkas({
			adapter: (process.env.RAKKAS_TARGET as any) || "node",
			prerender: ["/prerender"],
			routes: [
				{
					type: "page",
					path: "/custom",
					layouts: [
						"/src/custom-routes/custom-layout-outer.tsx",
						"/src/custom-routes/custom-layout-inner.tsx",
					],
					page: "/src/custom-routes/custom-page.tsx",
				},
			],
		}),
	],
});
