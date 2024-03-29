import headHooks from "../features/head/client-hooks";
import useQueryHooks from "../features/use-query/client-hooks";
import clientSideNavigationHooks from "../features/client-side-navigation/client-hooks";
import isomorphicFetchHooks from "../features/isomorphic-fetch/client-hooks";

import type { ClientHooks } from "./client-hooks";

export const featureClientHooks: ClientHooks[] = [
	useQueryHooks,
	headHooks,
	clientSideNavigationHooks,
	isomorphicFetchHooks,
];
