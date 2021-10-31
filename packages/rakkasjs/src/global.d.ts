declare const $rakkas$rendered: any;
declare const $rakkas$rootContext: Record<string, any>;

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

declare module "@rakkasjs/page-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/api-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/server-hooks" {
	import type {
		RawRequest,
		RakkasResponse,
		PageRenderOptions,
		// eslint-disable-next-line import/no-unresolved, import/no-duplicates
	} from "$lib/types";

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
	import type {
		LoadHelpers,
		// eslint-disable-next-line import/no-unresolved, import/no-duplicates
	} from "$lib/types";
	const beforeStartClient: (() => Promise<void>) | undefined;
	const wrap: undefined | ((page: JSX.Element) => JSX.Element);
	const createLoadHelpers:
		| undefined
		| (() => LoadHelpers | Promise<LoadHelpers>);
}
