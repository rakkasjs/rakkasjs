import { compose, RequestContext, RequestHandlerStack } from "@hattip/compose";
import { ReactElement } from "react";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";
import { QueryContext } from "../lib";
import serverHooks from "./feature-server-hooks";

export interface ServerHooks {
	middleware?: {
		beforePages?: RequestHandlerStack;
		beforeApiRoutes?: RequestHandlerStack;
		beforeNotFound?: RequestHandlerStack;
	};
	createPageHooks?(ctx: RequestContext): PageHooks;
}

export interface PageHooks {
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string | undefined;
	augmentQueryContext?(ctx: QueryContext): void | Promise<void>;
}

export function createRequestHandler(userHooks: ServerHooks = {}) {
	const hooks = [...serverHooks, userHooks];

	return compose(
		[
			init(hooks),

			hooks.map((hook) => hook.middleware?.beforePages),
			renderPageRoute,

			hooks.map((hook) => hook.middleware?.beforeApiRoutes),
			renderApiRoute,

			hooks.map((hook) => hook.middleware?.beforeNotFound),
			notFound,
			renderPageRoute,
		].flat(),
	);
}

function init(hooks: ServerHooks[]) {
	return (ctx: RequestContext) => {
		const { url, method } = ctx.request;
		ctx.url = new URL(url);
		ctx.method = method;
		ctx.locals = {};
		ctx.hooks = hooks;
	};
}

function notFound(ctx: RequestContext) {
	ctx.notFound = true;
}
