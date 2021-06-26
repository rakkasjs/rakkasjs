declare const __RAKKAS_RENDERED: any;
declare const __RAKKAS_ROOT_CONTEXT: any;

interface Window {
	__RAKKAS_RAKKAS_CONTEXT: any;
	__RAKKAS_ROUTER_CONTEXT: any;
}

declare const __RAKKAS_CONFIG: {
	pagesDir: string;
	apiDir: string;
	apiRoot: string;
};

declare const __RAKKAS_ROUTES: any;

declare module "@rakkasjs/page-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/api-imports" {
	const importer: Record<string, () => Promise<any>>;
	export default importer;
}

declare module "@rakkasjs/server-hooks" {
	const getRootContext: (() => Promise<Record<string, unknown>>) | undefined;
}

declare module "@rakkasjs/client-hooks" {
	const beforeStartClient: (() => Promise<void>) | undefined;
}
