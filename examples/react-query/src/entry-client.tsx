/* eslint-disable no-var */
import { startClient } from "rakkasjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function setQueryData(data: Record<string, unknown>) {
	for (const [key, value] of Object.entries(data)) {
		queryClient.setQueryData(JSON.parse(key), value, { updatedAt: Date.now() });
	}
}

declare global {
	var $TQD: Record<string, unknown> | undefined;
	var $TQS: typeof setQueryData;
}

const queryClient = new QueryClient();

// Insert data that was already streamed before this point
setQueryData(globalThis.$TQD ?? Object.create(null));
// Delete the global variable so that it doesn't get serialized again
delete globalThis.$TQD;
// From now on, insert data directly
globalThis.$TQS = setQueryData;

startClient({
	hooks: {
		extendPageContext(ctx) {
			ctx.reactQueryClient = queryClient;
		},

		wrapApp(app) {
			return (
				<QueryClientProvider client={queryClient}>{app}</QueryClientProvider>
			);
		},
	},
});
