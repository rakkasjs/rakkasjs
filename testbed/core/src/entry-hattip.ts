import { createApp } from "@rakkasjs/core/server";
import { createRenderer } from "@rakkasjs/react/server";
import viteClientManifest from "$client/manifest.json";
import routes from "rakkasjs:server-routes";

export const requestHandler = createApp({
	viteClientManifest,
	routes,
	middleware: {
		beforePages: [
			(ctx) => {
				console.log(ctx.method, ctx.url.pathname + ctx.url.search);
			},
			createRenderer(),
		],
	},
});
