import { CreateServerHooksFn } from "./server-hooks";

import createHeadHooks from "../features/head/server-hooks";
import createUseQueryServerHooks from "../features/use-query/server-hooks";
import createUseServerSideServerHooks from "../features/run-server-side/server-hooks";
import createIsomorphicFetchHooks from "../features/isomorphic-fetch/server-hooks";
import createClientSideNavigationServerHooks from "../features/client-side-navigation/server-hooks";

const serverHooks: CreateServerHooksFn[] = [
	createClientSideNavigationServerHooks,
	createIsomorphicFetchHooks,
	createUseQueryServerHooks,
	createHeadHooks,
	createUseServerSideServerHooks,
];

export default serverHooks;
