import { compose, RequestContext, RequestHandlerStack } from "@hattip/compose";
import { ReactElement } from "react";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";
import serverHooks from "./feature-server-hooks";

export interface ServerHooks {
	middleware?: {
		beforePages?: RequestHandlerStack;
		beforeApiRoutes?: RequestHandlerStack;
		beforeNotFound?: RequestHandlerStack;
	};
	createPageHooks?: (ctx: RequestContext) => PageHooks;
}

export interface PageHooks {
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string | undefined;
}

export function createRequestHandler(hooks: ServerHooks = {}) {
	return compose(
		[
			init,

			serverHooks.map((hook) => hook.middleware?.beforePages),
			hooks.middleware?.beforePages,
			renderPageRoute,

			serverHooks.map((hook) => hook.middleware?.beforeApiRoutes),
			hooks.middleware?.beforeApiRoutes,
			renderApiRoute,

			serverHooks.map((hook) => hook.middleware?.beforeNotFound),
			hooks.middleware?.beforeNotFound,
		].flat(),
	);
}

function init(ctx: RequestContext) {
	const { url, method } = ctx.request;
	ctx.url = new URL(url);
	ctx.method = method;
	ctx.locals = {};
}
