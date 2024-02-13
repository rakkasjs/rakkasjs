import "rakkasjs";

declare module "rakkasjs" {
	interface PageContext {
		tanstackQueryClient: import("@tanstack/react-query").QueryClient;
	}

	interface CommonPluginOptions {
		defaultTanstackQueryOptions?: import("@tanstack/react-query").DefaultOptions;
	}

	interface RakkasBrowserGlobal {
		tanstackQuery: {
			queryData?: Record<string, unknown>;
			setQueryData?: (data: Record<string, unknown>) => void;
		};
	}
}
