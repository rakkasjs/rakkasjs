import { useContext } from "react";
import { UseQueryOptions } from "../use-query/implementation";
import { ServerSideContextImpl } from "./implementation/lib-impl";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerSideContext {}

export function useServerSideContext() {
	return useContext(ServerSideContextImpl);
}

export type ServerSideFunction<T> = (
	context: ServerSideContext,
) => T | Promise<T>;

export interface UseServerSideQueryOptions extends UseQueryOptions {
	key?: string;
	usePostMethod?: boolean;
}
