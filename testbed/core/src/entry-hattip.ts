import { createApp } from "@rakkasjs/core/server";
import { createRenderer } from "@rakkasjs/react/server";
import routes from "rakkasjs:server-routes";

export const requestHandler = createApp({
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
