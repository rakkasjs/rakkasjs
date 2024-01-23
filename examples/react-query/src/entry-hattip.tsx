import { createRequestHandler } from "rakkasjs/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { uneval } from "devalue";

declare module "rakkasjs" {
	interface PageContext {
		reactQueryClient: QueryClient;
	}
}

export default createRequestHandler({
	createPageHooks() {
		let thereIsUnsentData = false;
		let unsentData: Record<string, unknown> = Object.create(null);

		const queryClient = new QueryClient();
		queryClient.getQueryCache().subscribe(({ type, query }) => {
			if (type !== "updated" || query.state.status !== "success") return;
			unsentData[query.queryHash] = query.state.data;
			thereIsUnsentData = true;
		});

		return {
			async extendPageContext(ctx) {
				ctx.reactQueryClient = queryClient;
			},

			wrapApp(app) {
				return (
					<QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
				);
			},

			emitToDocumentHead() {
				return `<script>$TQD=Object.create(null);$TQS=data=>Object.assign($TQD,data);</script>`;
			},

			emitBeforeSsrChunk() {
				if (!thereIsUnsentData) return "";

				// Emit a script that calls the global $TQS function with the
				// newly fetched query data.

				const serialized = uneval(unsentData);
				unsentData = Object.create(null);
				thereIsUnsentData = false;

				return `<script>$TQS(${serialized})</script>`;
			},
		};
	},
});
