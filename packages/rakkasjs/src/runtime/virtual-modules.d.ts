declare module "rakkasjs:api-routes" {
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

declare module "rakkasjs:server-page-routes" {
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
			/** undefined = hydrate, 1 = server, 2 = client */
			mode?: 1 | 2,
		]
	>;

	export default routes;
	export const notFoundRoutes: typeof routes;
}

declare module "rakkasjs:client-page-routes" {
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

declare module "rakkasjs:client-manifest" {
	const manifest: undefined | import("vite").Manifest;
	export default manifest;
}

declare module "rakkasjs:run-server-side:manifest" {
	export const moduleMap: Record<
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

	export const idMap: Record<string, string>;
}

declare module "rakkasjs:hattip-entry" {
	const handler: import("@hattip/core").HattipHandler;
	export default handler;
}

declare module "rakkasjs:common-hooks" {
	const hooks: import("./common-hooks").CommonHooks;
	export default hooks;
	export const commonPluginOptions:
		| import("./common-hooks").CommonPluginOptions
		| undefined;
}

declare module "rakkasjs:error-page" {
	const ErrorComponent: import("React").ComponentType<
		import("react-error-boundary").FallbackProps
	>;
	export default ErrorComponent;
}

declare module "rakkasjs:plugin-server-hooks" {
	import { ServerHooks, ServerPluginOptions } from "./hattip-handler";
	import { CommonPluginOptions } from "./common-hooks";

	const pluginServerHookFactories: Array<
		(
			serverOptions: ServerPluginOptions,
			commonOptions: CommonPluginOptions,
		) => ServerHooks
	>;

	export default pluginServerHookFactories;
}

declare module "rakkasjs:plugin-client-hooks" {
	import { ClientHooks } from "./client-hooks";
	import { ClientPluginOptions } from "./client-entry";
	import { CommonPluginOptions } from "./common-hooks";

	const pluginClientHookFactories: Array<
		(
			clientOptions: ClientPluginOptions,
			commonOptions: CommonPluginOptions,
		) => ClientHooks
	>;
	export default pluginClientHookFactories;
}

declare module "rakkasjs:plugin-common-hooks" {
	import { CommonHooks, CommonPluginOptions } from "./common-hooks";
	const pluginCommonHookFactories: Array<
		(commonOptions: CommonPluginOptions) => CommonHooks
	>;
	export default pluginCommonHookFactories;
}
