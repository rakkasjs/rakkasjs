import React from "react";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { LoadHelpers } from "rakkasjs";

const apolloClient = new ApolloClient({
	uri: "/api/graphql",
	cache: new InMemoryCache().restore((window as any).__APOLLO_STATE__),
});

export function wrap(app: JSX.Element) {
	return <ApolloProvider client={apolloClient}>{app}</ApolloProvider>;
}

export function createLoadHelpers(): LoadHelpers {
	// Make the client available as a load helper so that load functions can use it
	return { apolloClient };
}
