declare const $rakkas$rendered: any;
declare const $rakkas$rootContext: Record<string, any>;

declare interface Window {
	$rakkas$reloader: Record<string, (m: any) => void>;
	readonly $rakkas$routes: any;
}

declare module "@rakkasjs/page-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/api-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/server-hooks" {
	// eslint-disable-next-line import/no-unresolved
	import type { RawRequest, RakkasResponse } from "$lib/types";

	const servePage:
		| ((
				request: RawRequest,
				renderPage: (
					request: RawRequest,
					context: Record<string, unknown>,
				) => Promise<RakkasResponse>,
		  ) => Promise<RakkasResponse>)
		| undefined;
}

declare module "@rakkasjs/client-hooks" {
	const beforeStartClient: (() => Promise<void>) | undefined;
}
