import "rakkasjs";

declare module "rakkasjs" {
	interface PageContext {
		tanstackQueryClient: import("@tanstack/react-query").QueryClient;
	}

	interface CommonPluginOptions {
		defaultTanstackQueryOptions?: import("@tanstack/react-query").DefaultOptions;
	}
}

declare global {
	var __rakkas: {
		tanstackQuery: {
			queryData?: Record<string, unknown>;
			setQueryData?: typeof import("@tanstack/react-query").setQueryData;
		};
	};
}
