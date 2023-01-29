import { createApp } from "@rakkasjs/core/server";
import { compose } from "@hattip/compose";
import routes from "rakkasjs:server-routes";

const app = createApp(routes);

export const requestHandler = compose((ctx) => {
	console.log(ctx.method, ctx.url.pathname + ctx.url.search);
}, app);
