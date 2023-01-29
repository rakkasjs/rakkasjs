import { composePartial, RequestHandler } from "@hattip/compose";

export function createApp(routes: ServerRoute[]): RequestHandler {
	return async function app(ctx) {
		for (const route of routes) {
			const match = ctx.url.pathname.match(route[0]);
			if (!match) continue;

			const [routeModule, ...wrapperModules] = await Promise.all([
				route[1](),
				...route[2].map((i) => i()),
			]);

			const methodHandler = routeModule[ctx.method as Method];
			if (!methodHandler) continue;

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
	};
}

declare module "@hattip/compose" {
	interface RequestContextExtensions {
		/** Dynamic path parameters */
		params: Record<string, string>;
	}
}

type ServerRoute = [
	pattern: RegExp,
	routeImporter: () => Promise<RouteModule>,
	wrapperImporters: Array<() => Promise<WrapperModule>>,
];

type RouteModule = {
	[method in Method]?: RequestHandler;
};

interface WrapperModule {
	middleware?: RequestHandler;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
