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

declare const RAKKAS_LOCALES: string[] | undefined;
declare const RAKKAS_DETECT_LOCALE: boolean;
declare const RAKKAS_LOCALE_COOKIE_NAME: string | undefined;

declare module "virtual:rakkasjs:page-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "virtual:rakkasjs:api-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "virtual:rakkasjs:server-hooks" {
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

declare module "virtual:rakkasjs:client-hooks" {
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

declare module "virtual:rakkasjs:common-hooks" {
	const commonHooks: any;
	export default commonHooks;
}

declare module "virtual:rakkasjs:placeholder" {
	export default function render(): Promise<React.ReactNode>;
}
