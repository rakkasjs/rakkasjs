import type { RequestContext } from "@hattip/compose";
import { requestContextStorage } from "./implementation";

/**
 * Get the request context for the current request.
 *
 * On the server, it will return the context for the current request. On the
 * client, it will return `undefined`.
 *
 * This feature depends on AsyncLocalStorage support. If it is not available,
 * it will throw an error.
 */
export function getRequestContext(): RequestContext | undefined {
	const ctx = requestContextStorage?.getStore();

	if (!ctx) {
		throw new Error("Request context not found");
	}

	return ctx;
}
