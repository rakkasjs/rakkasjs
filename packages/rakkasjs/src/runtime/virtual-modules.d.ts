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
