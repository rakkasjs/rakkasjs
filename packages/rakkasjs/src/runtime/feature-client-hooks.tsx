import reactHelmetAsyncHooks from "../features/head/client-hooks";
import useQueryHooks from "../features/use-query/client-hooks";
import clientOnlyHooks from "../features/client-only/client-hooks";
import clientSideNavigationHooks from "../features/client-side-navigation/client-hooks";
import isomorphicFetchHooks from "../features/isomorphic-fetch/client-hooks";

import { ClientHooks } from "./client-hooks";

const clientHooks: ClientHooks[] = [
	useQueryHooks,
	reactHelmetAsyncHooks,
	clientOnlyHooks,
	clientSideNavigationHooks,
	isomorphicFetchHooks,
];

export default clientHooks;
