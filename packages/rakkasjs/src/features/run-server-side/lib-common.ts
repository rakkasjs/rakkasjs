import type { RequestContext } from "@hattip/compose";
import { type FormEvent, useContext } from "react";
import type {
	UseMutationErrorResult,
	UseMutationIdleResult,
	UseMutationLoadingResult,
	UseMutationOptions,
	UseMutationSuccessResult,
} from "../../lib";
import { ServerSideContext } from "../../runtime/isomorphic-context";
import type { UseQueryOptions } from "../use-query/implementation";
import type { ActionResult } from "../../runtime/page-types";

/**
 * Hook for getting the request context. Returns undefined on the client.
 */
export function useRequestContext() {
	return useContext(ServerSideContext);
}

/** Callback passed to useServerSide/runServerside family of functions */
export type ServerSideFunction<T> = (
	context: RunServerSideContext,
) => T | Promise<T>;

export interface RunServerSideContext extends RequestContext {
	/** Response headers. Especially useful for setting cache control headers. */
	headers: Headers;
}

/** Options for {@link runServerSideQuery} */
export interface RunServerSideQueryOptions {
	/**
	 * Unique ID for this query. Rakkas will generate a unique ID if not provided.
	 * This must be a string literal that is unique across the entire application.
	 */
	uniqueId?: string;
	/**
	 * If true, a POST request will be sent instead of GET. It may be useful
	 * when the query requires a large amount of data to be sent from the
	 * client. The down side is that it cannot be prerendered or cached so it
	 * shouldn't be used when rendering static pages.
	 */
	usePostMethod?: boolean;
}

/** Options for {@link runServerSideMutation} */
export interface RunServerSideMutationOptions {
	/**
	 * Unique ID for this mutation. Rakkas will generate a unique ID if not provided.
	 * This must be a string literal that is unique across the entire application.
	 */
	uniqueId?: string;
}

/** Options for {@link useServerSideQuery} */
export interface UseServerSideQueryOptions<
	T = unknown,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
> extends UseQueryOptions<T, Enabled, InitialData, PlaceholderData> {
	/**
	 * Unique ID for this query. Rakkas will generate a unique ID if not provided.
	 * This must be a string literal that is unique across the entire application.
	 */
	uniqueId?: string;
	/** Query key. Rakkas will generate a unique key if not provided. */
	queryKey?: string;
	/** @deprecated use `queryKey` instead. */
	key?: string;
	/**
	 * If true, a POST request will be sent instead of GET. It may be useful
	 * when the query requires a large amount of data to be sent from the
	 * client. The down side is that it cannot be prerendered or cached so it
	 * shouldn't be used when rendering static pages.
	 */
	usePostMethod?: boolean;
}

/** Options for {@link useServerSideMutation} */
export interface UseServerSideMutationOptions<T = unknown, V = unknown>
	extends UseMutationOptions<T, V> {
	/**
	 * Unique ID for this mutation. Rakkas will generate a unique ID if not provided.
	 * This must be a string literal that is unique across the entire application.
	 */
	uniqueId?: string;
}

export type UseFormMutationResult<T> = {
	action: string;
	submitHandler(event: FormEvent<HTMLFormElement>): void;
} & (
	| UseMutationIdleResult
	| UseMutationLoadingResult
	| UseMutationErrorResult
	| UseMutationSuccessResult<T>
);

export type UseFormMutationFn<T> = (
	context: RunServerSideContext,
) => ActionResult<T> | Promise<ActionResult<T>>;
