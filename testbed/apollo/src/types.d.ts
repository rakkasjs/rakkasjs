import "rakkasjs";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

declare module "rakkasjs" {
	interface LoadHelpers {
		apolloClient: ApolloClient<NormalizedCacheObject>;
	}
}
