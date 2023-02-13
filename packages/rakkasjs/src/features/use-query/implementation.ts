/// <reference types="vite/client" />

import type { RequestContext } from "@hattip/compose";
import {
	useContext,
	useEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from "react";
import { PageLocals, useErrorHandler } from "../../lib";
import { IsomorphicContext } from "../../runtime/isomorphic-context";
import { createNamedContext } from "../../runtime/named-context";
import {
	EventStreamContentType,
	fetchEventSource,
} from "@microsoft/fetch-event-source";

export interface CacheItem {
	value?: any;
	error?: any;
	promise?: Promise<any>;
	date?: number;
	subscribers: Set<() => void>;
	hydrated: boolean;
	cacheTime: number;
	evictionTimeout?: ReturnType<typeof setTimeout>;
	invalid?: boolean;
}

export interface QueryCache {
	has(key: string): boolean;
	get(key: string): CacheItem | undefined;
	set(key: string, value: any, cacheTime?: number): void;
	invalidate(key: string): void;
	subscribe(key: string, fn: () => void): () => void;
	enumerate(): Iterable<string>;
}

export const QueryCacheContext = createNamedContext<QueryCache>(
	"QueryCacheContext",
	undefined as any,
);

/** useQuery options */
export interface UseQueryOptions {
	/**
	 * Time in milliseconds after which the value will be evicted from the
	 * cache when there are no subscribers. Use 0 for immediate eviction and
	 * `Infinity` to disable.
	 *
	 * @default 300_000 (5 minutes)
	 */
	cacheTime?: number;
	/**
	 * Time in milliseconds after which a cached value will be considered
	 * stale.
	 *
	 * @default 100
	 */
	staleTime?: number;
	/**
	 * Refetch the query when the component is mounted. If set to `true`, a stale
	 * query will be refetched when the component is mounted. If set to `"always"`,
	 * the query will be refetched when the component is mounted regardless of
	 * staleness. `false` disables this behavior.
	 *
	 * @default true
	 */
	refetchOnMount?: boolean | "always";
	/**
	 * Refetch the query when the window gains focus. If set to `true`, the
	 * query will be refetched on window focus if it is stale. If set to
	 * `"always"`, the query will be refetched on window focus regardless of
	 * staleness. `false` disables this behavior.
	 *
	 * @default false
	 */
	refetchOnWindowFocus?: boolean | "always";
	/**
	 * Continuously refetch every `refetchInterval` milliseconds. Set to false
	 * to disable.
	 *
	 * @default false
	 */
	refetchInterval?: number | false;
	/**
	 * Perform continuous refetching even when the window is in the background.
	 *
	 * @default false
	 */
	refetchIntervalInBackground?: boolean;
	/**
	 * Refetch the query when the internet connection is restored. If set to
	 * `true`, a stale query will be refetched when the internet connection is
	 * restored. If set to `"always"`, the query will be refetched when the
	 * internet connection is restored regardless of staleness. `false` disables
	 * this behavior.
	 *
	 * @default false
	 */
	refetchOnReconnect?: boolean | "always";
}

export const DEFAULT_QUERY_OPTIONS: Required<UseQueryOptions> = {
	cacheTime: 5 * 60 * 1000,
	staleTime: 100,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchInterval: false,
	refetchIntervalInBackground: false,
	refetchOnReconnect: false,
};

/** Context within which the page is being rendered */
export interface PageContext {
	/** URL */
	url: URL;
	/** Isomorphic fetch function */
	fetch: typeof fetch;
	/** Query client used by useQuery */
	queryClient: QueryClient;
	/** Request context, only defined on the server */
	requestContext?: RequestContext;
	/** Application-specific stuff */
	locals: PageLocals;
	/** Page action data */
	actionData?: any;
}

export function usePageContext(): PageContext {
	return useContext(IsomorphicContext);
}

/** Function passed to useQuery */
export type QueryFn<T> = (ctx: PageContext) => T | Promise<T>;

/**
 * Fetches data
 *
 * @template T      Type of data
 * @param key       Query key. Queries with the same key are considered identical. Pass undefined to disable the query.
 * @param fn        Query function that does the actual data fetching
 * @param [options] Query options
 * @returns query   Query result
 */
export function useQuery<T>(
	key: undefined,
	fn: QueryFn<T>,
	options?: UseQueryOptions,
): undefined;

export function useQuery<T>(
	key: string,
	fn: QueryFn<T>,
	options?: UseQueryOptions,
): QueryResult<T>;

export function useQuery<T>(
	key: string | undefined,
	fn: QueryFn<T>,
	options?: UseQueryOptions,
): QueryResult<T> | undefined;

export function useQuery<T>(
	key: string | undefined,
	fn: QueryFn<T>,
	options: UseQueryOptions = {},
): QueryResult<T> | undefined {
	const fullOptions = { ...DEFAULT_QUERY_OPTIONS, ...options };
	const result = useQueryBase(key, fn, fullOptions);
	useRefetch(result, fullOptions);

	return result;
}

export function useEventSource<T>(url: string): EventSourceResult<T> {
	const [result, setResult] = useState<EventSourceResult<T>>({});

	const errorHandler = useErrorHandler();

	useEffect(() => {
		const ctrl = new AbortController();
		fetchEventSource(url, {
			credentials: "include",
			signal: ctrl.signal,
			async onopen(response) {
				const { ok, status, headers } = response;
				if (ok && headers.get("content-type") === EventStreamContentType)
					return;
				const error = new Error(await response.text());
				// unretriable error
				if (status >= 400 && status < 500 && status !== 429)
					return errorHandler(error);
				// retriable error
				throw error;
			},
			onclose() {
				// retriable error
				throw new Error();
			},
			onmessage({ data }) {
				setResult({
					data: (0, eval)("(" + data + ")"),
					dataUpdatedAt: Date.now(),
				});
			},
		}).catch(errorHandler);
		return () => ctrl.abort();
	}, [url, errorHandler, setResult]);

	return result;
}

function useQueryBase<T>(
	key: string | undefined,
	fn: QueryFn<T>,
	options: Required<UseQueryOptions>,
): QueryResult<T> | undefined {
	const { cacheTime, staleTime, refetchOnMount } = options;

	const cache = useContext(QueryCacheContext);

	const item = useSyncExternalStore(
		(onStoreChange) => {
			if (key !== undefined) {
				return cache.subscribe(key, () => {
					onStoreChange();
				});
			} else {
				return () => {
					// Do nothing
				};
			}
		},
		() => (key === undefined ? undefined : cache.get(key)),
		() => (key === undefined ? undefined : cache.get(key)),
	);

	const ctx = usePageContext();

	useEffect(() => {
		const cacheItem = key ? cache.get(key) : undefined;

		if (cacheItem === undefined) {
			return;
		}

		if (
			(cacheItem.invalid ||
				(refetchOnMount &&
					(refetchOnMount === "always" ||
						!cacheItem.date ||
						staleTime <= Date.now() - cacheItem.date))) &&
			!cacheItem.promise &&
			!cacheItem.hydrated
		) {
			const promiseOrValue = fn(ctx);
			cache.set(key!, promiseOrValue, cacheTime);
		}

		cacheItem.hydrated = false;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, item?.invalid]);

	// preserve reference between calls
	const queryResultReference = useMemo(() => ({} as QueryResult<T>), []);

	if (key === undefined) {
		return;
	}

	if (!import.meta.env.SSR && item && "error" in item) {
		const error = item.error;

		throw error;
	}

	function refetch() {
		const item = cache.get(key!);
		if (!item?.promise) {
			cache.set(key!, fn(ctx), cacheTime);
		}
	}

	if (item && "value" in item) {
		return Object.assign(queryResultReference, {
			data: item.value,
			isRefetching: !!item.promise,
			refetch,
			dataUpdatedAt: item.date,
		});
	}

	if (item?.promise) {
		throw item.promise;
	}

	const result = fn(ctx);
	cache.set(key, result, cacheTime);

	if (result instanceof Promise) {
		throw result;
	}

	return Object.assign(queryResultReference, {
		data: result,
		refetch,
		isRefetching: false,
		dataUpdatedAt: item?.date ?? Date.now(),
	});
}

/** Return value of useQuery */
export interface QueryResult<T> {
	/** Fetched data */
	data: T;
	/** Refetch the data */
	refetch(): void;
	/** Is the data being refetched? */
	isRefetching: boolean;
	/** Update date of the last returned data */
	dataUpdatedAt?: number;
}

export interface EventSourceResult<T> {
	/** Last data */
	data?: T;
	/** Update date of the last returned data */
	dataUpdatedAt?: number;
}

function useRefetch<T>(
	queryResult: QueryResult<T> | undefined,
	options: Required<UseQueryOptions>,
) {
	const {
		refetchOnWindowFocus,
		refetchInterval,
		refetchIntervalInBackground,
		staleTime,
		refetchOnReconnect,
	} = options;

	// Refetch on window focus
	useEffect(() => {
		if (!queryResult || !refetchOnWindowFocus) return;

		function handleVisibilityChange() {
			if (
				document.visibilityState === "visible" &&
				(refetchOnWindowFocus === "always" ||
					!queryResult!.dataUpdatedAt ||
					staleTime <= Date.now() - queryResult!.dataUpdatedAt)
			) {
				queryResult!.refetch();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleVisibilityChange);
		};
	}, [refetchOnWindowFocus, queryResult, staleTime]);

	// Refetch on interval
	useEffect(() => {
		if (!refetchInterval || !queryResult) return;

		const id = setInterval(() => {
			if (
				refetchIntervalInBackground ||
				document.visibilityState === "visible"
			) {
				queryResult.refetch();
			}
		}, refetchInterval);

		return () => {
			clearInterval(id);
		};
	}, [refetchInterval, refetchIntervalInBackground, queryResult]);

	// Refetch on reconnect
	useEffect(() => {
		if (!refetchOnReconnect || !queryResult) return;

		function handleReconnect() {
			queryResult!.refetch();
		}

		window.addEventListener("online", handleReconnect);

		return () => {
			window.removeEventListener("online", handleReconnect);
		};
	}, [refetchOnReconnect, queryResult]);
}

/** Query client that manages the cache used by useQuery */
export interface QueryClient {
	/** Get the data cached for the given key */
	getQueryData(key: string): any;
	/**
	 * Set the data associated for the given key.
	 * You can also pass a promise here.
	 */
	setQueryData(key: string, data: any): void;
	/**
	 * Start fetching the data for the given key.
	 */
	prefetchQuery(key: string, data: Promise<any>): void;
	/**
	 * Invalidate one or more queries.
	 */
	invalidateQueries(
		keys?: string | string[] | ((key: string) => boolean),
	): void;
}

/** Access the query client that manages the cache used by useQuery */
export function useQueryClient(): QueryClient {
	const ctx = useContext(IsomorphicContext);

	return ctx.queryClient;
}

export function createQueryClient(cache: QueryCache): QueryClient {
	return {
		getQueryData(key: string) {
			return cache.get(key)?.value;
		},

		setQueryData(key: string, data: any) {
			if (data instanceof Promise) {
				throw new TypeError("data must be synchronous");
			}
			cache.set(key, data);
		},

		prefetchQuery(key: string, data: Promise<any>) {
			cache.set(key, data);
		},

		invalidateQueries(keys) {
			if (typeof keys === "string") {
				cache.invalidate(keys);
				return;
			} else if (Array.isArray(keys)) {
				keys.forEach((key) => cache.invalidate(key));
				return;
			}

			for (const key of cache.enumerate()) {
				const shouldInvalidate = keys === undefined || keys(key);
				if (shouldInvalidate) {
					cache.invalidate(key);
				}
			}
		},
	};
}
