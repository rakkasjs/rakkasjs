import type { ClientPluginFactory } from "rakkasjs/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const tanstackQueryClientHooksFactory: ClientPluginFactory = (_, options) => {
	const queryClient = new QueryClient({
		defaultOptions: options.defaultTanstackQueryOptions,
	});

	function doSetQueryData(data: Record<string, unknown>) {
		for (const [key, value] of Object.entries(data)) {
			queryClient.setQueryData(JSON.parse(key), value, {
				updatedAt: Date.now(),
			});
		}
	}

	const tq = window.__rakkas.tanstackQuery;

	// Insert data that was already streamed before this point
	doSetQueryData(tq.queryData ?? Object.create(null));
	// Delete the global variable so that it doesn't get serialized again
	delete tq.queryData;
	// From now on, insert data directly
	tq.setQueryData = doSetQueryData;

	return {
		extendPageContext: {
			order: "pre",
			handler(ctx) {
				ctx.tanstackQueryClient = queryClient;
			},
		},

		wrapApp(app) {
			return (
				<QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
			);
		},
	};
};

export default tanstackQueryClientHooksFactory;
