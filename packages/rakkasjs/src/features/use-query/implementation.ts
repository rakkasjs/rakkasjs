/// <reference types="vite/client" />

import {
	createContext,
	useContext,
	useEffect,
	useSyncExternalStore,
} from "react";

export interface CacheItem {
	value?: any;
	error?: any;
	promise?: Promise<any>;
	date: number;
	subscribers: Set<() => void>;
	hydrated: boolean;
	evictionTime: number;
	evictionTimeout?: ReturnType<typeof setTimeout>;
}

export interface QueryCache {
	has(key: string): boolean;
	get(key: string): CacheItem | undefined;
	set(key: string, value: any, evictionTime: number): void;
	subscribe(key: string, fn: () => void): () => void;
}

export const QueryCacheContext = createContext<QueryCache>(undefined as any);

export interface UseQueryOptions {
	/**
	 * Time in milliseconds after which the value will be evicted from the
	 * cache when there are no subscribers. Use 0 for immediate eviction and
	 * `Infinity` to disable. @default 300_000 (5 minutes)
	 * */
	evictionTime?: number;
	/**
	 * Time in milliseconds after which a cached value will be considered
	 * stale. @default 0 (always refetch in the background on mount)
	 */
	staleTime?: number;
}

export const DEFAULT_EVICTION_TIME = 5 * 60 * 1000;

export function useQuery<T>(
	key: undefined,
	fn: () => T | Promise<T>,
	options?: UseQueryOptions,
): undefined;

export function useQuery<T>(
	key: string,
	fn: () => T | Promise<T>,
	options?: UseQueryOptions,
): QueryResult<T>;

export function useQuery<T>(
	key: string | undefined,
	fn: () => T | Promise<T>,
	options: UseQueryOptions = {},
): QueryResult<T> | undefined {
	const { evictionTime = DEFAULT_EVICTION_TIME, staleTime = 0 } = options;

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

	useEffect(() => {
		if (item === undefined) {
			return;
		}

		if (
			!import.meta.env.SSR &&
			staleTime <= Date.now() - item.date &&
			!item.promise
		) {
			const promiseOrValue = fn();
			cache.set(key!, promiseOrValue, evictionTime);
		}
	}, [key]);

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
			cache.set(key!, fn(), evictionTime);
		}
	}

	if (item && "value" in item) {
		return {
			value: item.value,
			refetching: !!item.promise,
			refetch,
		};
	}

	if (item?.promise) {
		throw item.promise;
	}

	const result = fn();
	cache.set(key, result, evictionTime);

	if (result instanceof Promise) {
		throw result;
	}

	return {
		value: result,
		refetch,
		refetching: false,
	};
}

export interface QueryResult<T> {
	value: T;
	refetch(): void;
	refetching: boolean;
}
