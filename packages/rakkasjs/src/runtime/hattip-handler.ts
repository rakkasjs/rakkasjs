import { compose, RequestContext, RequestHandlerStack } from "@hattip/compose";
import { ReactElement } from "react";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";
import { PageContext } from "../lib";
import serverHooks from "./feature-server-hooks";

declare module "@hattip/compose" {
	interface RequestContextExtensions {
		/** Dynamic path parameters */
		params: Record<string, string>;
		/** Isomorphic fetch function */
		fetch: typeof fetch;
		/** Server-side customiization hooks */
		hooks: ServerHooks[];
		/** Set to true when searching for a not found page */
		notFound?: boolean;
	}
}

/** Server-side customization hooks */
export interface ServerHooks {
	/**
	 * Hattip middleware handlers to insert at various stages of the request
	 * processing chain
	 */
	middleware?: {
		/** Middlewares to be run before mathcing pages */
		beforePages?: RequestHandlerStack;
		/** Middlewares to be run before matching API routes */
		beforeApiRoutes?: RequestHandlerStack;
		/** Middlewares to be run before not-found handling */
		beforeNotFound?: RequestHandlerStack;
	};
	/** Create server-side page rendering hooks */
	createPageHooks?(ctx: RequestContext): PageRequestHooks;
}

/** Hooks for customizing the page rendering on the server */
export interface PageRequestHooks {
	/**
	 * This is called before the page is rendered. It's used for adding custom
	 * data to the page context.
	 */
	extendPageContext?(ctx: PageContext): void | Promise<void>;
	/**
	 * This hook is intended for wrapping the React app with provider
	 * components on the server only.
	 */
	wrapApp?(app: ReactElement): ReactElement;
	/** Write to the document's head section */
	emitToDocumentHead?(): string;
	/** Emit a chunk of HTML before each time React emits a chunk */
	emitBeforeSsrChunk?(): string | undefined;
	/** Wrap React's SSR stream */
	wrapSsrStream?(stream: ReadableStream): ReadableStream;
}

/**
 * Creates a HatTip request handler. Call this to create a HatTip request
 * handler and fefault export it from your HatTip entry.
 */
export function createRequestHandler(userHooks: ServerHooks = {}) {
	const hooks = [...serverHooks, userHooks];

	return compose(
		[
			init(hooks),

			hooks.map((hook) => hook.middleware?.beforePages).flat(),

			process.env.RAKKAS_PRERENDER === "true" && prerender,

			async (ctx: RequestContext) => {
				try {
					return await renderPageRoute(ctx);
				} catch (error) {
					console.error(error);
				}
			},

			hooks.map((hook) => hook.middleware?.beforeApiRoutes).flat(),
			renderApiRoute,

			hooks.map((hook) => hook.middleware?.beforeNotFound).flat(),
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

		// console.log(`${method} ${url}`);
	};
}

function notFound(ctx: RequestContext) {
	ctx.notFound = true;
}

async function prerender(ctx: RequestContext) {
	if (ctx.method !== "GET") return;

	const response = await ctx.next();
	await (ctx.platform as any).render(
		ctx.url.pathname,
		response.clone(),
		(ctx.platform as any).prerenderOptions,
	);
	return response;
}
