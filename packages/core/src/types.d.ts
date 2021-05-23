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

declare module "@rakkasjs:endpoints" {
	import { ComponentType } from "react";
	const endpoints: [string, () => Promise<any>][];
	export default endpoints;
}

declare var __RAKKAS_INITIAL_DATA: any[];
