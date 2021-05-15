declare module "@rakkasjs:routes.tsx" {
	import type { RouteRenderArgs } from "@rakkasjs/core";

	export function findAndRenderRoute({
		url,
	}: RouteRenderArgs): Promise<JSX.Element>;
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
