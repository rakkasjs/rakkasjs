import React from "react";
import { ServePageHook } from "rakkasjs";
import {
	ApolloClient,
	InMemoryCache,
	ApolloProvider,
	NormalizedCacheObject,
	createHttpLink,
} from "@apollo/client";
import { SchemaLink } from "@apollo/client/link/schema";
import { schema } from "./schema";
import { renderToStringWithData } from "@apollo/client/react/ssr";

export const servePage: ServePageHook = (request, renderPage) => {
	let apolloClient: ApolloClient<NormalizedCacheObject>;

	return renderPage(request, undefined, {
		createLoadHelpers: () => {
			apolloClient = new ApolloClient({
				ssrMode: true,
				cache: new InMemoryCache(),

				// SchemaLink avoids network roundtrips when accessing your own schema
				link: new SchemaLink({ schema, context: (request) => request }),

				// But if you want to access external GraphQL server, you should use
				// an HttpLink with the server URL instead:
				// link: createHttpLink({ uri: "https://example.com/graphql" }),
			});

			// Make the client available as a load helper so that load functions can use it
			return { apolloClient };
		},

		wrap: (page) => (
			<ApolloProvider client={apolloClient}>{page}</ApolloProvider>
		),

		renderToString: renderToStringWithData,

		getHeadHtml() {
			const cache = apolloClient.extract();
			return `<script>__APOLLO_STATE__=(${JSON.stringify(cache).replace(
				/</g,
				"\\u003c",
			)})</script>`;
		},
	});
};
