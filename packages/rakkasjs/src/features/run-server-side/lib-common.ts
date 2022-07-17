import type { RequestContext } from "@hattip/compose";
import { useContext } from "react";
import { ServerSideContext } from "../../runtime/isomorphic-context";
import { UseQueryOptions } from "../use-query/implementation";

/**
 * Hook for getting the request context. Returns undefined on the client.
 */
export function useRequestContext() {
	return useContext(ServerSideContext);
}

/** Callback passed to useServerSide/runServerside family of functions */
export type ServerSideFunction<T> = (context: RequestContext) => T | Promise<T>;

/** Options for {@link useServerSideQuery} */
export interface UseServerSideQueryOptions extends UseQueryOptions {
	/** Query key. Rakkas will generate a unique key if not provided. */
	key?: string;
	/**
	 * If true, a POST request will be sent instead of GET. It may be useful
	 * when the query requires a large amount of data to be sent from the
	 * client. The down side is that it cannot be prerendered so it shouldn't
	 * be used when rendering static pages.
	 */
	usePostMethod?: boolean;
}
