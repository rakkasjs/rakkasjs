import { HattipHandler } from "@hattip/core";
import {
	compose,
	composePartial,
	RequestContext,
	RequestHandler,
} from "@hattip/compose";

export interface CreateAppOptions {
	routes: ServerRoute[];
	middleware?: {
		beforePages?: RequestHandler[];
		after?: RequestHandler[];
	};
}

export function createApp(options: CreateAppOptions): HattipHandler {
	const { routes, middleware: { beforePages = [], after = [] } = {} } = options;

	async function app(ctx: RequestContext) {
		ctx.fetch = async function fetch(input, init) {
			let url: URL | undefined;

			if (!(input instanceof Request)) {
				url = new URL(input, ctx.url);
				input = url.href;
			}

			const newRequest = new Request(input, init);
			url = url || new URL(newRequest.url, ctx.url);

			const sameOrigin = url.origin === ctx.url.origin;

			let requestCredentials: RequestCredentials | undefined;
			try {
				requestCredentials = init?.credentials ?? newRequest.credentials;
			} catch {
				// Miniflare throws when accessing credentials
			}

			const credentials =
				requestCredentials ?? init?.credentials ?? "same-origin";

			const includeCredentials =
				credentials === "include" ||
				(credentials === "same-origin" && sameOrigin);

			if (includeCredentials) {
				const cookie = ctx.request.headers.get("cookie");
				if (cookie !== null) {
					newRequest.headers.set("cookie", cookie);
				}

				const authorization = ctx.request.headers.get("authorization");
				if (authorization !== null) {
					newRequest.headers.set("authorization", authorization);
				}
			} else {
				// Node fetch doesn't honor the credentials property
				newRequest.headers.delete("cookie");
				newRequest.headers.delete("authorization");
			}

			let response: Response | undefined | null;

			if (sameOrigin) {
				response = await hattipHandler({
					request: newRequest,
					ip: ctx.ip,
					waitUntil: ctx.waitUntil,
					passThrough: ctx.passThrough,
					platform: ctx.platform,
				});
			}

			return response ?? globalThis.fetch(newRequest);
		};

		for (const route of routes) {
			const match = ctx.url.pathname.match(route[0]);
			if (!match) continue;

			const [routeModule, ...wrapperModules] = await Promise.all([
				route[1](),
				...route[2].map((i) => i()),
			]);

			let methodHandler = routeModule[ctx.method as Method];
			if (!methodHandler) {
				if (routeModule.default) {
					methodHandler = (ctx) =>
						ctx.render?.({
							page: routeModule,
							layouts: wrapperModules,
						});
				} else {
					continue;
				}
			}

			const middleware = wrapperModules
				.map((m) => m.middleware)
				.filter(Boolean) as RequestHandler[];

			const handler = composePartial([...middleware, methodHandler]);

			ctx.params = match.groups ?? {};

			const restParamName = route[0].source.match(
				/<([a-zA-Z_][a-zA-Z0-9_]*)>\(\?:\\\/\.\*\)\?\$\)$/,
			)?.[1];

			for (const key in ctx.params) {
				if (key === restParamName) continue;
				ctx.params[key] = decodeURIComponent(ctx.params[key]);
			}

			return handler(ctx);
		}
	}

	const hattipHandler = compose(beforePages, app, after);

	return hattipHandler;
}

declare module "@hattip/compose" {
	interface RequestContextExtensions {
		/** Dynamic path parameters */
		params: Record<string, string>;
		/** Isomorphic fetch function */
		fetch: typeof fetch;
		/** Render a page */
		render?(options: RenderOptions): Promise<Response>;
	}
}

export interface RenderOptions {
	page: RouteModule;
	layouts: WrapperModule[];
}

type ServerRoute = [
	pattern: RegExp,
	routeImporter: () => Promise<RouteModule>,
	wrapperImporters: Array<() => Promise<WrapperModule>>,
];

type RouteModule = {
	[method in Method]?: RequestHandler;
} & {
	default?: unknown;
};

interface WrapperModule {
	default?: unknown;
	middleware?: RequestHandler;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
