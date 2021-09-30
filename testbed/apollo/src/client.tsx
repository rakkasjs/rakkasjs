import React from "react";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { LoadHelpers } from "rakkasjs";

const apolloClient = new ApolloClient({
	uri: "/api/graphql",
	cache: new InMemoryCache().restore((window as any).__APOLLO_STATE__),
});

// This is a trick to delay client-side hydration: Hydration won't happen until the Cypress test script calls document.rakkasHydrate() so we can reliably
// inspect the DOM before the hyration happens.
export function beforeStartClient(): Promise<void> {
	return new Promise<void>((resolve) => {
		(document as any).rakkasHydrate = resolve;
	});
}

export function wrap(app: JSX.Element) {
	return <ApolloProvider client={apolloClient}>{app}</ApolloProvider>;
}

export function createLoadHelpers(): LoadHelpers {
	return { apolloClient };
}
