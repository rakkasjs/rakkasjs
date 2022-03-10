declare module "virtual:rakkasjs:api-routes" {
	type Handler = import("@hattip/core").Handler;

	const routes: Array<[RegExp, [EndpointImporter, ...MiddlewareImporter[]]]>;

	type EndpointImporter = () => Promise<Endpoint>;
	type MiddlewareImporter = () => Promise<Middleware>;

	type Endpoint =
		| Record<string, Handler>
		| { default: Record<string, Handler> };

	type Middleware = { default: Handler };

	export default routes;
}

declare module "virtual:rakkasjs:server-page-routes" {
	const routes: Array<[RegExp, [PageDescription, ...LayoutDescription[]]]>;

	type PageDescription = [name: string, importer: () => Promise<PageModule>];
	type LayoutDescription = [
		name: string,
		importer: () => Promise<LayoutModule>,
	];

	type PageModule = import("./page-types").PageModule;
	type LayoutModule = import("./page-types").LayoutModule;

	export default routes;
}
