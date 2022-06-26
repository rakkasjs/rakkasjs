import headServerHooks from "../features/head/server-hooks";
import useQueryServerHooks from "../features/use-query/server-hooks";
import useServerSideServerHooks from "../features/run-server-side/server-hooks";
import isomorphicFetchServerHooks from "../features/isomorphic-fetch/server-hooks";
import clientSideNavigationServerHooks from "../features/client-side-navigation/server-hooks";
import { ServerHooks } from "./hattip-entry";

const serverHooks: ServerHooks[] = [
	headServerHooks,
	useQueryServerHooks,
	useServerSideServerHooks,
	isomorphicFetchServerHooks,
	clientSideNavigationServerHooks,
];

export default serverHooks;
