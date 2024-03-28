import {
	compose,
	type RequestContext,
	type RequestHandler,
} from "@hattip/compose";
import type { ReactElement } from "react";
import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";
import type { PageContext } from "../runtime/page-types";
import serverFeatureHooks from "./feature-server-hooks";
import { type HookDefinition, sortHooks } from "./utils";
import pluginFactories, {
	options as configOptions,
} from "rakkasjs:plugin-server-hooks";
import * as commonHooksModule from "rakkasjs:common-hooks";
import type { CommonPluginOptions } from "./common-hooks";
import type {
	HeadElement,
	HeadProps,
} from "../features/head/implementation/types";
import type { HattipHandler } from "@hattip/core";

declare module "@hattip/compose" {
	interface RequestContextExtensions {
		/** Dynamic path parameters */
		params: Record<string, string>;
		/** Isomorphic fetch function */
		fetch: typeof fetch;
		/**
		 * Internal stuff, don't use it in user code.
		 *
		 * @internal
		 */
		rakkas: {
			/** Server-side customiization hooks */
			hooks: ServerHooks[];
			/** Set to true when searching for a not found page */
			notFound: boolean;
			/** Head tags */
			head: HeadProps[];
		};
	}
}

/** Server-side customization hooks */
export interface ServerHooks {
	/**
	 * Hattip middleware handlers to insert at various stages of the request
	 * processing chain
	 */
	middleware?: {
		/** Middlewares to be run before everything */
		beforeAll?: Array<
			false | null | undefined | HookDefinition<RequestHandler>
		>;
		/** Middlewares to be run before matching pages */
		beforePages?: Array<
			false | null | undefined | HookDefinition<RequestHandler>
		>;
		/** Middlewares to be run before matching API routes */
		beforeApiRoutes?: Array<
			false | null | undefined | HookDefinition<RequestHandler>
		>;
		/** Middlewares to be run before not-found handling */
		beforeNotFound?: Array<
			false | null | undefined | HookDefinition<RequestHandler>
		>;
	};

	/** Create server-side page rendering hooks */
	createPageHooks?(ctx: RequestContext): PageRequestHooks;
}

export interface ServerPluginOptions {}

export type ServerPluginFactory = (
	options: ServerPluginOptions,
	commonOptions: CommonPluginOptions,
	configOptions: any,
) => ServerHooks;

/** Hooks for customizing the page rendering on the server */
export interface PageRequestHooks {
	/**
	 * This is called before the page is rendered. It's used for adding custom
	 * data to the page context.
	 */
	extendPageContext?: HookDefinition<
		(ctx: PageContext) => void | Promise<void>
	>;

	/**
	 * This hook is intended for wrapping the React app with provider
	 * components on the server only.
	 */
	wrapApp?: HookDefinition<(app: ReactElement) => ReactElement>;

	/**
	 * Write to the document's head section.
	 *
	 * @deprecated Use `emitToSyncHeadScript`, `emitServerOnlyHeadElements` or
	 * the normal Head component instead.
	 */
	emitToDocumentHead?: HookDefinition<() => ReactElement | string | undefined>;

	/** Write to the document's head section */
	emitServerOnlyHeadElements?: HookDefinition<() => HeadElement[] | undefined>;

	/** Emit a piece of code to be inserted into a script tag in the head. */
	emitToSyncHeadScript?: HookDefinition<() => string | undefined>;

	/** Emit a chunk of HTML before each time React emits a chunk */
	emitBeforeSsrChunk?: HookDefinition<() => string | undefined>;

	/** Wrap React's SSR stream */
	wrapSsrStream?: HookDefinition<(stream: ReadableStream) => ReadableStream>;
}

/**
 * Creates a HatTip request handler. Call this to create a HatTip request
 * handler and default export it from your HatTip entry.
 */
export function createRequestHandler<T>(
	userHooks: ServerHooks = {},
	pluginOptions: ServerPluginOptions = {},
): HattipHandler<T> {
	const hooks = [
		...pluginFactories.map((factory, i) => {
			const { commonPluginOptions = {} } = commonHooksModule;
			return factory(pluginOptions, commonPluginOptions, configOptions[i]);
		}),
		...serverFeatureHooks,
		userHooks,
	];

	const beforeAll = sortHooks(
		hooks.map((hook) => hook.middleware?.beforeAll).flat(),
	);
	const beforePages = sortHooks(
		hooks.map((hook) => hook.middleware?.beforePages).flat(),
	);
	const beforeApiRoutes = sortHooks(
		hooks.map((hook) => hook.middleware?.beforeApiRoutes).flat(),
	);
	const beforeNotFound = sortHooks(
		hooks.map((hook) => hook.middleware?.beforeNotFound).flat(),
	);

	return compose(
		[
			// Disable compose's default error handling in development
			// so that we can forward errors to Vite for a nice error overlay
			import.meta.env.DEV &&
				((ctx: RequestContext) => {
					ctx.handleError = (error: unknown) => {
						throw error;
					};
				}),

			process.env.RAKKAS_PRERENDER === "true" && prerender,

			init(hooks),

			beforeAll,
			beforePages,
			async (ctx: RequestContext) => {
				try {
					return await renderPageRoute(ctx);
				} catch (error) {
					if (!process.env.RAKKAS_PRERENDER) {
						console.error(error);
					}
				}
			},

			beforeApiRoutes,
			renderApiRoute,

			beforeNotFound,
			notFound,

			async (ctx: RequestContext) => {
				try {
					return await renderPageRoute(ctx);
				} catch (error) {
					if (!process.env.RAKKAS_PRERENDER) {
						console.error(error);
					}
				}
			},
		].flat(),
	);
}

function init(hooks: ServerHooks[]) {
	return (ctx: RequestContext) => {
		ctx.rakkas = {
			hooks,
			notFound: false,
			head: [],
		};
	};
}

function notFound(ctx: RequestContext) {
	ctx.rakkas.notFound = true;
}

async function prerender(ctx: RequestContext) {
	if (ctx.method !== "GET") return;

	let caught: unknown;
	(ctx.platform as any).reportError = (error: unknown) => {
		caught = error;
	};

	const response = await ctx.next();
	await (ctx.platform as any).render(
		ctx.url.pathname,
		response.clone(),
		(ctx.platform as any).prerenderOptions,
		caught,
	);
	return response;
}
