import React from "react";
import { ServePageHook } from "rakkasjs";
import {
	ApolloClient,
	InMemoryCache,
	ApolloProvider,
	NormalizedCacheObject,
} from "@apollo/client";
import { SchemaLink } from "@apollo/client/link/schema";
import { schema } from "./schema";
import { renderToStringWithData } from "@apollo/client/react/ssr";
import devalue from "devalue";

export const servePage: ServePageHook = (request, renderPage) => {
	let apolloClient: ApolloClient<NormalizedCacheObject>;

	return renderPage(request, undefined, {
		createLoadHelpers: (fetch) => {
			apolloClient = new ApolloClient({
				ssrMode: true,
				cache: new InMemoryCache(),
				link: new SchemaLink({ schema, context: (request) => request }),
				// link: createHttpLink({ fetch, uri: "/api/graphql" }),
			});

			return { apolloClient };
		},

		wrap: (page) => (
			<ApolloProvider client={apolloClient}>{page}</ApolloProvider>
		),

		renderToString: renderToStringWithData,

		getHeadHtml() {
			const cache = apolloClient.extract();
			return `<script>__APOLLO_STATE__=(0,eval)(${devalue(cache)})</script>`;
		},
	});
};
