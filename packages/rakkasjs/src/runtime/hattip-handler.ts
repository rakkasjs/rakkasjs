import { compose, RequestContext } from "@hattip/compose";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";

export const hattipHandler = compose([
	urlAndMethod,
	renderApiRoute,
	renderPageRoute,
]);

function urlAndMethod(ctx: RequestContext) {
	const { url, method } = ctx.request;
	ctx.url = new URL(url);
	ctx.method = method;
}
