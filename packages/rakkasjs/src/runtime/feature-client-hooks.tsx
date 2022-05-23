import * as reactHelmetAsyncHooks from "../features/head/client-hooks";
import * as useQueryHooks from "../features/use-query/client-hooks";
import * as clientOnlyHooks from "../features/client-only/client-hooks";
import * as clientSideNavigation from "../features/client-side-navigation/client-hooks";

import { ClientHooksModule } from "./client-hooks";

const clientHooks: ClientHooksModule[] = [
	useQueryHooks,
	reactHelmetAsyncHooks,
	clientOnlyHooks,
	clientSideNavigation,
];

export default clientHooks;
