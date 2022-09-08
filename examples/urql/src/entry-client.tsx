import { startClient } from "rakkasjs";
import {
	createClient,
	dedupExchange,
	cacheExchange,
	fetchExchange,
	ssrExchange,
	Provider,
} from "urql";

const ssr = ssrExchange({ isClient: true });

const client = createClient({
	url: "https://swapi-graphql.netlify.app/.netlify/functions/index",
	exchanges: [dedupExchange, cacheExchange, ssr],
	suspense: true,
});

ssr.restoreData((window as any).__URQL_DATA__);

startClient({
	hooks: {
		wrapApp(app) {
			return <Provider value={client}>{app}</Provider>;
		},
	},
});
