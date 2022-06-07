import React, { ReactElement, ReactNode } from "react";
import {
	CacheItem,
	DEFAULT_CACHE_TIME,
	QueryCacheContext,
} from "./implementation";

// Rakkas Suspense Cache
declare const $RSC: Record<string, any>;

const queryCache: Record<string, CacheItem | undefined> = Object.create(null);

export function resetErrors() {
	const subscribers = new Set<() => void>();

	for (const key in queryCache) {
		const item = queryCache[key]!;
		if ("error" in item) {
			delete item.error;
			item.subscribers.forEach((subscriber) => subscribers.add(subscriber));
		}
	}

	subscribers.forEach((subscriber) => subscriber());
}

export function wrapApp(app: ReactElement): ReactElement {
	return <Wrapper>{app}</Wrapper>;
}

function Wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryCacheContext.Provider value={cache}>
			{children}
		</QueryCacheContext.Provider>
	);
}

const cache = {
	has(key: string) {
		return key in queryCache || key in $RSC;
	},

	get(key: string) {
		if (!queryCache[key] && key in $RSC) {
			queryCache[key] = {
				value: $RSC[key],
				subscribers: new Set(),
				date: Date.now(),
				hydrated: true,
				cacheTime: DEFAULT_CACHE_TIME,
			};

			delete $RSC[key];
		}

		return queryCache[key];
	},

	set(key: string, valueOrPromise: any, cacheTime: number) {
		if (valueOrPromise instanceof Promise) {
			queryCache[key] ||= {
				date: Date.now(),
				hydrated: false,
				subscribers: new Set(),
				cacheTime,
			};
			queryCache[key] = {
				...queryCache[key]!,
				promise: valueOrPromise,
				cacheTime: Math.max(queryCache[key]!.cacheTime, cacheTime),
			};

			valueOrPromise.then(
				(value) => {
					queryCache[key] = {
						...queryCache[key]!,
						value,
						hydrated: false,
						date: Date.now(),
					};
					delete queryCache[key]!.promise;

					queryCache[key]!.subscribers.forEach((subscriber) => subscriber());
				},
				(error) => {
					delete queryCache[key]!.promise;
					queryCache[key]!.error = error;
					throw error;
				},
			);
		} else {
			queryCache[key] ||= {
				date: Date.now(),
				hydrated: false,
				subscribers: new Set(),
				cacheTime,
			};
			queryCache[key] = {
				...queryCache[key]!,
				value: valueOrPromise,
				hydrated: false,
				date: Date.now(),
			};
			delete queryCache[key]!.promise;
		}

		queryCache[key]!.subscribers.forEach((subscriber) => subscriber());
	},
	subscribe(key: string, fn: () => void) {
		queryCache[key] ||= {
			subscribers: new Set(),
			date: Date.now(),
			hydrated: false,
			cacheTime: DEFAULT_CACHE_TIME,
		};
		queryCache[key]!.subscribers.add(fn);
		if (queryCache[key]!.evictionTimeout !== undefined) {
			clearTimeout(queryCache[key]!.evictionTimeout);
			delete queryCache[key]!.evictionTimeout;
		}

		return () => {
			if (!queryCache[key]) return;
			queryCache[key]!.subscribers.delete(fn);
			if (queryCache[key]!.subscribers.size === 0) {
				delete queryCache[key]!.error;

				if (queryCache[key]!.cacheTime === 0) {
					delete queryCache[key];
				} else if (isFinite(queryCache[key]!.cacheTime)) {
					queryCache[key]!.evictionTimeout = setTimeout(() => {
						delete queryCache[key];
					}, queryCache[key]!.cacheTime);
				}
			}
		};
	},
};
