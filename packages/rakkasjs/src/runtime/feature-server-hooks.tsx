import asyncLocalRequestContextServerHooks from "../features/async-local-request-context/server-hooks";
import headHooks from "../features/head/server-hooks";
import useQueryHooks from "../features/use-query/server-hooks";
import useServerSideHooks from "../features/run-server-side/server-hooks";
import isomorphicFetchHooks from "../features/isomorphic-fetch/server-hooks";
import clientSideNavigationHooks from "../features/client-side-navigation/server-hooks";
import type { ServerHooks } from "./hattip-handler";

const serverFeatureHooks: ServerHooks[] = [
	asyncLocalRequestContextServerHooks,
	headHooks,
	useQueryHooks,
	isomorphicFetchHooks,
	useServerSideHooks,
	clientSideNavigationHooks,
];

export default serverFeatureHooks;
