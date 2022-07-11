import { compose, RequestContext, RequestHandlerStack } from "@hattip/compose";
import { ReactElement } from "react";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";
import { PageContext } from "../lib";
import { BeforeRouteResult } from "./common-hooks";
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
	extendPageContext?(ctx: PageContext): void | Promise<void>;
	beforeRoute?(ctx: PageContext, url: URL): BeforeRouteResult;
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string | undefined;
}

export function createRequestHandler(userHooks: ServerHooks = {}) {
	const hooks = [...serverHooks, userHooks];

	return compose(
		[
			init(hooks),

			hooks.map((hook) => hook.middleware?.beforePages),

			process.env.RAKKAS_PRERENDER === "true" && prerender,
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

async function prerender(ctx: RequestContext) {
	if (ctx.method !== "GET") return;

	const response = await ctx.next();
	await (ctx.platform as any).render(ctx.url.pathname, response.clone());
	return response;
}
