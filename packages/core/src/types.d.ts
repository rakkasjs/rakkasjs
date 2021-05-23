declare module "@rakkasjs:routes.tsx" {
	import { ComponentType } from "react";
	import type { RouteRenderArgs } from "bare-routes";

	function findAndRenderRoute(
		{ url }: RouteRenderArgs,
		initialData?: any[],
	): Promise<{
		params: any;
		stack: Array<{
			component: ComponentType<{}>;
			props: any;
		}>;
	}>;
}

declare module "@rakkasjs:pages" {
	import { ComponentType } from "react";
	const pages: [string, () => Promise<{ default: ComponentType }>][];
	export default pages;
}

declare module "@rakkasjs:layouts" {
	import { ComponentType } from "react";
	const layouts: [string, () => Promise<{ default: ComponentType }>][];
	export default layouts;
}

declare var __RAKKAS_INITIAL_DATA: any[];
