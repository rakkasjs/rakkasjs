/* eslint-disable @typescript-eslint/no-empty-interface */
import "rakkasjs";

declare module "rakkasjs" {
	interface RootContext {
		// Define the your root context type here. (see https://rakkasjs.org/guide/layout-context#root-context)
	}

	interface LoadHelpers {
		// Define the type for your load helpers here. (see https://rakkasjs.org/guide/load-helpers)
	}
}

// This is necessary for TypeScript compiler to ignore CSS module imports
declare module "*.module.css" {
	const styles: { [key: string]: string };
	export default styles;
}
