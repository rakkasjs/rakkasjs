import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { uneval } from "devalue";
import type { ServerPluginFactory } from "rakkasjs/server";

const tanstackQueryServerHooksFactory: ServerPluginFactory = (_, options) => ({
	createPageHooks() {
		let thereIsUnsentData = false;
		let unsentData = Object.create(null);

		const queryClient = new QueryClient({
			defaultOptions: options.defaultTanstackQueryOptions,
		});
		queryClient.getQueryCache().subscribe(({ type, query }) => {
			if (type !== "updated" || query.state.status !== "success") return;
			unsentData[query.queryHash] = query.state.data;
			thereIsUnsentData = true;
		});

		return {
			extendPageContext(ctx) {
				ctx.tanstackQueryClient = queryClient;
			},

			wrapApp(app) {
				return (
					<QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
				);
			},

			emitToSyncHeadScript() {
				const serialized = uneval(unsentData);
				unsentData = Object.create(null);
				thereIsUnsentData = false;
				return `rakkas.tanstackQuery={queryData:${serialized},setQueryData:data=>Object.assign(rakkas.tanstackQuery.queryData,data)};`;
			},

			emitBeforeSsrChunk() {
				if (!thereIsUnsentData) return "";

				const serialized = uneval(unsentData);
				unsentData = Object.create(null);
				thereIsUnsentData = false;

				return `<script>rakkas.tanstackQuery.setQueryData(${serialized})</script>`;
			},
		};
	},
});

export default tanstackQueryServerHooksFactory;
