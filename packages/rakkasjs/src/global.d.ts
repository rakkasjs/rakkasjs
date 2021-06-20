declare const __RAKKAS_RENDERED: any;

declare const __RAKKAS_ROOT_CONTEXT: any;

declare const __RAKKAS_CONFIG: {
	pagesDir: string;
	apiDir: string;
	apiRoot: string;
};

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
