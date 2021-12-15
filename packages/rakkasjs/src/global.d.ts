declare let $rakkas$rendered: any;
declare let $rakkas$rootContext: Record<string, any>;

declare interface Window {
	$rakkas$reloader: Record<string, (m: any) => void>;
	readonly $rakkas$routes: any;
}

declare const RAKKAS_BUILD_TARGET:
	| "node"
	| "static"
	| "vercel"
	| "netlify"
	| "cloudflare-workers";

declare const RAKKAS_BUILD_ID: string;

declare module "@rakkasjs/page-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/api-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/server-hooks" {
	const servePage:
		| ((
				request: RawRequest,
				renderPage: (
					request: RawRequest,
					context?: Record<string, unknown>,
					options?: PageRenderOptions,
				) => Promise<RakkasResponse>,
		  ) => Promise<RakkasResponse>)
		| undefined;
}

declare module "@rakkasjs/client-hooks" {
	const beforeStartClient:
		| ((rootContext: RootContext) => Promise<void>)
		| undefined;

	const wrap:
		| undefined
		| ((page: JSX.Element, rootContext: RootContext) => JSX.Element);

	const createLoadHelpers:
		| undefined
		| ((rootContext: RootContext) => LoadHelpers | Promise<LoadHelpers>);
}
