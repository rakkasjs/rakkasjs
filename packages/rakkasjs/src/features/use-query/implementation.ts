/// <reference types="vite/client" />

import type { RequestContext } from "@hattip/compose";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { PageLocals, useErrorBoundary } from "../../lib";
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
export interface UseQueryOptions<
	T = unknown,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
> {
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
	/**
	 * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
	 * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
	 * Defaults to `true`.
	 */
	enabled?: Enabled;
	/**
	 * If set, this value will be used as the initial data for this query.
	 */
	initialData?: InitialData;
	/**
	 * If set, this value will be used as the placeholder data for this particular query observer while the query is still fetching and no initialData has been provided.
	 */
	placeholderData?: PlaceholderData;
	/**
	 * If set, any previous data will be kept when fetching new data because the query key changed.
	 */
	keepPreviousData?: boolean;
}

export interface CompleteUseQueryOptions<
	T = unknown,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
> extends UseQueryOptions<T, Enabled, InitialData, PlaceholderData> {
	queryKey: string;
	queryFn: QueryFn<T>;
}

type RequiredUseQueryOptions<T = unknown> = Required<
	Omit<UseQueryOptions<T>, "initialData" | "placeholderData">
> &
	Pick<UseQueryOptions<T>, "initialData" | "placeholderData">;

export const DEFAULT_QUERY_OPTIONS: RequiredUseQueryOptions = {
	cacheTime: 5 * 60 * 1000,
	staleTime: 100,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchInterval: false,
	refetchIntervalInBackground: false,
	refetchOnReconnect: false,
	enabled: true,
	keepPreviousData: false,
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

export interface CreateQueryOptions<
	Args extends any[],
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
> extends UseQueryOptions<T, Enabled, InitialData, PlaceholderData> {
	createKey(...args: Args): string;
	queryFn(ctx: PageContext, ...args: Args): T | Promise<T>;
}

export function createQuery<
	Args extends any[],
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	options: CreateQueryOptions<Args, T, Enabled, InitialData, PlaceholderData>,
): (
	...args: Args
) => CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData> {
	const { createKey, queryFn, ...useQueryOptions } = options;

	return (...args: Args) => {
		const key = createKey(...args);
		return {
			...useQueryOptions,
			queryKey: key,
			queryFn: (ctx) => queryFn(ctx, ...args),
		};
	};
}

/**
 * Fetches data
 */
export function useQuery<
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	options: CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData>,
): QueryResult<T, Enabled, InitialData, PlaceholderData>;

export function useQuery<
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	key: string,
	fn: QueryFn<T>,
	options?: UseQueryOptions<T, Enabled, InitialData, PlaceholderData>,
): QueryResult<T, Enabled, InitialData, PlaceholderData>;

export function useQuery<
	T,
	Enabled extends boolean,
	InitialData extends T | undefined,
	PlaceholderData = undefined,
>(
	keyOrOptions:
		| string
		| CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData>,
	maybeFn?: QueryFn<T>,
	maybeOptions?: UseQueryOptions<T, Enabled, InitialData, PlaceholderData>,
): QueryResult<T, Enabled, InitialData, PlaceholderData> {
	const {
		queryKey: key,
		queryFn: fn,
		...options
	} = typeof keyOrOptions === "string"
		? {
				queryKey: keyOrOptions,
				queryFn: maybeFn!,
				...maybeOptions,
			}
		: keyOrOptions;

	const fullOptions = {
		...DEFAULT_QUERY_OPTIONS,
		...options,
		queryKey: key,
		queryFn: fn,
	} as Required<
		CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData>
	>;

	const result = useQueryBase(fullOptions);
	useRefetch(result, fullOptions);

	return result;
}

export function useEventSource<T>(url: string): EventSourceResult<T> {
	const [result, setResult] = useState<EventSourceResult<T>>({});

	const { showBoundary } = useErrorBoundary();

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
					return showBoundary(error);
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
		}).catch(showBoundary);
		return () => ctrl.abort();
	}, [url, setResult, showBoundary]);

	return result;
}

function useQueryBase<
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	options: Required<
		CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData>
	>,
): QueryResult<T, Enabled, InitialData, PlaceholderData> {
	const {
		queryKey,
		queryFn,
		cacheTime,
		staleTime,
		refetchOnMount,
		enabled,
		initialData,
		placeholderData,
		keepPreviousData,
	} = options;

	const [initialEnabled] = useState(enabled);
	const cache = useContext(QueryCacheContext);

	const item = useSyncExternalStore(
		(onStoreChange) => {
			if (queryKey !== undefined) {
				return cache.subscribe(queryKey, () => {
					onStoreChange();
				});
			} else {
				return () => {
					// Do nothing
				};
			}
		},
		() => (queryKey === undefined ? undefined : cache.get(queryKey)),
		() => (queryKey === undefined ? undefined : cache.get(queryKey)),
	);

	const ctx = usePageContext();

	const previousItem = useRef<CacheItem | undefined>(undefined);
	useEffect(() => {
		if (keepPreviousData && item && "value" in item) {
			previousItem.current = item;
		}
	}, [item, keepPreviousData]);

	useEffect(() => {
		const cacheItem = queryKey ? cache.get(queryKey) : undefined;

		if (cacheItem === undefined) {
			return;
		}

		if (
			enabled &&
			(cacheItem.invalid ||
				(refetchOnMount &&
					(refetchOnMount === "always" ||
						!cacheItem.date ||
						staleTime <= Date.now() - cacheItem.date))) &&
			!cacheItem.promise &&
			!cacheItem.hydrated
		) {
			const promiseOrValue = queryFn(ctx);
			cache.set(queryKey!, promiseOrValue, cacheTime);
		}

		cacheItem.hydrated = false;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryKey, item?.invalid]);

	// preserve reference between calls
	const queryResultReference = useMemo(() => ({}) as QueryResult<T>, []);

	const refetch = useCallback(
		function refetch() {
			const item = cache.get(queryKey!);
			if (!item?.promise) {
				cache.set(queryKey!, queryFn(ctx), cacheTime);
			}
		},
		[cache, cacheTime, ctx, queryFn, queryKey],
	);

	if (item && "value" in item) {
		return Object.assign(queryResultReference, {
			data: item.value,
			isRefetching: !!item.promise,
			refetch,
			dataUpdatedAt: item.date,
			error: item.error,
		});
	}

	if (!import.meta.env.SSR && item && "error" in item) {
		const error = item.error;
		throw error;
	}

	if (
		initialData === undefined &&
		(placeholderData !== undefined || !initialEnabled)
	) {
		return Object.assign(queryResultReference, {
			data: placeholderData,
			isRefetching: enabled,
			refetch,
			dataUpdatedAt: Date.now(),
		}) as any;
	}

	const returnPreviousOrSuspend = (promise: Promise<any>) => {
		if (keepPreviousData && previousItem.current !== undefined) {
			return Object.assign(queryResultReference, {
				data: previousItem.current.value,
				isRefetching: true,
				refetch,
				dataUpdatedAt: previousItem.current.date,
			});
		}
		throw promise;
	};

	if (item?.promise) {
		return returnPreviousOrSuspend(item.promise);
	}

	let result: ReturnType<QueryFn<T>> | undefined = initialData;
	let shouldCache = initialData !== undefined;
	if (initialData === undefined && enabled) {
		shouldCache = true;
		result = queryFn(ctx);
	}

	if (shouldCache) {
		cache.set(queryKey, result, cacheTime);
	}

	if (result instanceof Promise) {
		return returnPreviousOrSuspend(result);
	}

	return Object.assign(queryResultReference, {
		data: result,
		refetch,
		isRefetching: false,
		dataUpdatedAt: item?.date ?? Date.now(),
	}) as any;
}

/** Return value of useQuery */
export interface QueryResult<
	T,
	Enabled extends boolean = true,
	InitialData = undefined,
	PlaceholderData = undefined,
> {
	/** Fetched data */
	data: InitialData extends undefined
		? Enabled extends true
			? PlaceholderData extends undefined
				? T
				: PlaceholderData | T
			: PlaceholderData | T
		: T;
	/** Refetch the data */
	refetch(): void;
	/** Is the data being refetched? */
	isRefetching: boolean;
	/** Update date of the last returned data */
	dataUpdatedAt?: number;
	/** Error thrown by the query when a refetch fails */
	error?: any;
}

export interface EventSourceResult<T> {
	/** Last data */
	data?: T;
	/** Update date of the last returned data */
	dataUpdatedAt?: number;
}

function useRefetch<
	T,
	Enabled extends boolean,
	InitialData extends T | undefined,
	PlaceholderData,
>(
	queryResult:
		| QueryResult<T, Enabled, InitialData, PlaceholderData>
		| undefined,
	options: Required<
		CompleteUseQueryOptions<T, Enabled, InitialData, PlaceholderData>
	>,
) {
	const {
		refetchOnWindowFocus,
		refetchInterval,
		refetchIntervalInBackground,
		staleTime,
		refetchOnReconnect,
		enabled,
		initialData,
		placeholderData,
	} = options;

	const isEmpty = !queryResult;
	const { refetch } = queryResult || {};

	// Refetch on window focus
	useEffect(() => {
		if (isEmpty || !refetchOnWindowFocus || !enabled) return;

		function handleVisibilityChange() {
			if (
				document.visibilityState === "visible" &&
				(refetchOnWindowFocus === "always" ||
					!queryResult!.dataUpdatedAt ||
					staleTime <= Date.now() - queryResult!.dataUpdatedAt)
			) {
				refetch!();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", handleVisibilityChange);
		};
	}, [refetchOnWindowFocus, isEmpty, staleTime, enabled, queryResult, refetch]);

	// Refetch on enable
	const enabledRef = useRef(enabled);
	useEffect(() => {
		const prevEnabled = enabledRef.current;
		enabledRef.current = enabled;

		if (isEmpty || !enabled || prevEnabled) return;

		refetch!();
	}, [staleTime, enabled, isEmpty, refetch]);

	// Refetch after the first render if initialData/placeholderData was set
	useEffect(() => {
		if (
			queryResult &&
			enabled &&
			((initialData !== undefined && queryResult.data === initialData) ||
				(initialData === undefined &&
					placeholderData !== undefined &&
					queryResult.data === placeholderData))
		)
			queryResult.refetch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refetch on interval
	useEffect(() => {
		if (!refetchInterval || isEmpty || !enabled) return;

		const id = setInterval(() => {
			if (
				refetchIntervalInBackground ||
				document.visibilityState === "visible"
			) {
				refetch!();
			}
		}, refetchInterval);

		return () => {
			clearInterval(id);
		};
	}, [refetchInterval, refetchIntervalInBackground, enabled, isEmpty, refetch]);

	// Refetch on reconnect
	useEffect(() => {
		if (!refetchOnReconnect || isEmpty || !enabled) return;

		function handleReconnect() {
			refetch!();
		}

		window.addEventListener("online", handleReconnect);

		return () => {
			window.removeEventListener("online", handleReconnect);
		};
	}, [refetchOnReconnect, enabled, isEmpty, refetch]);
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
	prefetchQuery(options: PrefetchQueryOptions): void;
	/**
	 * Invalidate one or more queries.
	 */
	invalidateQueries(
		keys?: string | string[] | ((key: string) => boolean),
	): void;
}

export interface PrefetchQueryOptions {
	/** Query key */
	queryKey: string;
	/** Query function */
	queryFn: QueryFn<any>;
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
}

/** Access the query client that manages the cache used by useQuery */
export function useQueryClient(): QueryClient {
	const ctx = useContext(IsomorphicContext);

	return ctx.queryClient;
}

export function createQueryClient(
	cache: QueryCache,
	ctx: PageContext,
): QueryClient {
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

		prefetchQuery(options: PrefetchQueryOptions) {
			const {
				queryKey,
				queryFn,
				cacheTime = DEFAULT_QUERY_OPTIONS.cacheTime,
				staleTime = DEFAULT_QUERY_OPTIONS.staleTime,
			} = options;

			const current = cache.get(options.queryKey);
			if (
				current?.value !== undefined &&
				!current.invalid &&
				current.date !== undefined &&
				staleTime > Date.now() - current.date
			) {
				return;
			}

			try {
				cache.set(queryKey, queryFn(ctx), cacheTime);
			} catch {
				// Do nothing
			}
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
