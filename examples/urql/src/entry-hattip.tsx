import { createRequestHandler } from "rakkasjs";
import {
	createClient,
	dedupExchange,
	cacheExchange,
	fetchExchange,
	ssrExchange,
	Provider,
} from "urql";

export default createRequestHandler({
	createPageHooks() {
		const ssr = ssrExchange({ isClient: false });

		const client = createClient({
			url: "https://swapi-graphql.netlify.app/.netlify/functions/index",
			suspense: true,
			exchanges: [dedupExchange, cacheExchange, ssr, fetchExchange],
		});

		return {
			wrapApp(app) {
				return <Provider value={client}>{app}</Provider>;
			},

			emitToDocumentHead() {
				return `<script>__URQL_DATA__=${safeStringify(
					ssr.extractData(),
				)}</script>`;
			},
		};
	},
});

function safeStringify(obj: unknown) {
	return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/&/g, "\\u0026");
}
