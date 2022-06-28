import type { RequestContext } from "@hattip/compose";
import { useContext } from "react";
import { ServerSideContext } from "../../runtime/isomorphic-context";
import { UseQueryOptions } from "../use-query/implementation";

export function useServerSideContext() {
	return useContext(ServerSideContext);
}

export type ServerSideFunction<T> = (context: RequestContext) => T | Promise<T>;

export interface UseServerSideQueryOptions extends UseQueryOptions {
	key?: string;
	usePostMethod?: boolean;
}
