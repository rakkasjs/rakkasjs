import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "@hattip/compose";

export const requestContextStorage = AsyncLocalStorage
	? new AsyncLocalStorage<RequestContext>()
	: undefined;
