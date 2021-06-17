/* eslint-disable import/no-duplicates */
declare const __RAKKAS_INITIAL_DATA: Record<string, unknown>[];
declare const __RAKKAS_INITIAL_CONTEXT: Record<string, unknown>[];

declare module "@rakkasjs/pages-and-layouts" {
	import { PageModule, LayoutModule } from ".";
	export const pages: Record<string, () => Promise<PageModule>>;
	export const layouts: Record<string, () => Promise<LayoutModule>>;
}

declare module "@rakkasjs/endpoints-and-middleware" {
	import { EndpointModule, MiddlewareModule } from "./server";
	export const endpoints: Record<string, () => Promise<EndpointModule>>;
	export const middleware: Record<string, () => Promise<MiddlewareModule>>;
}
