declare module "virtual:rakkasjs:api-routes" {
	type Handler = import("@hattip/core").Handler;

	const routes: Array<
		[
			regexp: RegExp,
			importers: [EndpointImporter, ...MiddlewareImporter[]],
			rest?: string,
		]
	>;

	type EndpointImporter = () => Promise<Endpoint>;
	type MiddlewareImporter = () => Promise<Middleware>;

	type Endpoint =
		| Record<string, Handler>
		| { default: Record<string, Handler> };

	type Middleware = { default: Handler };

	export default routes;
}

declare module "virtual:rakkasjs:server-page-routes" {
	const routes: Array<
		[
			regexp: RegExp,
			importers: [
				import("./page-types").PageImporter,
				...import("./page-types").LayoutImporter[],
			],
			guards: import("./page-types").PageRouteGuard[],
			rest: string | undefined,
			ids: string[],
			/**
			 * Kept compact for bundle size reasons:
			 * undefined = hydrate, 1 = server, 2 = client
			 */
			mode?: 1 | 2,
		]
	>;

	export default routes;
	export const notFoundRoutes: typeof routes;
}

declare module "virtual:rakkasjs:client-page-routes" {
	const routes: Array<
		[
			regexp: RegExp,
			importers: [PageImporter, ...LayoutImporter[]],
			guards: PageRouteGuard[],
			rest?: string,
		]
	>;

	type PageRouteGuard = (
		ctx: import("../features/use-query/implementation").PageContext,
	) => boolean;

	type PageImporter = () => Promise<PageModule>;
	type LayoutImporter = () => Promise<LayoutModule>;

	type PageModule = import("./page-types").PageModule;
	type LayoutModule = import("./page-types").LayoutModule;

	export default routes;
	export const notFoundRoutes: typeof routes;
}

declare module "virtual:rakkasjs:client-manifest" {
	const manifest: undefined | import("vite").Manifest;
	export default manifest;
}

declare module "virtual:rakkasjs:run-server-side:manifest" {
	const manifest: Record<
		string,
		() => Promise<{
			$runServerSide$: Array<
				(
					closure: any,
					context: import("../lib").ServerSideContext,
					vars?: any,
				) => Promise<any>
			>;
		}>
	>;
	export default manifest;
}

declare module "virtual:rakkasjs:hattip-entry" {
	const handler: import("@hattip/core").HattipHandler;
	export default handler;
}

declare module "virtual:rakkasjs:common-hooks" {
	const handler: import("./common-hooks").CommonHooks;
	export default handler;
}

declare module "virtual:rakkasjs:error-page" {
	const ErrorComponent: import("React").ComponentType<
		import("react-error-boundary").FallbackProps
	>;
	export default ErrorComponent;
}
