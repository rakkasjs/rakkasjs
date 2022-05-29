import React, { ReactElement } from "react";
import {
	CacheItem,
	DEFAULT_EVICTION_TIME,
	QueryCacheContext,
} from "./implementation";

// Rakkas Suspense Cache
declare const $RSC: Record<string, any>;

const queryCache: Record<string, CacheItem | undefined> = Object.create(null);

export function wrapApp(app: ReactElement): ReactElement {
	return (
		<QueryCacheContext.Provider
			value={{
				has(key) {
					return key in queryCache || key in $RSC;
				},

				get: (key) => {
					if (!queryCache[key] && key in $RSC) {
						queryCache[key] = {
							value: $RSC[key],
							subscribers: new Set(),
							date: Date.now(),
							hydrated: true,
							evictionTime: DEFAULT_EVICTION_TIME,
						};

						delete $RSC[key];
					}

					return queryCache[key];
				},

				set: (key, valueOrPromise, evictionTime) => {
					if (valueOrPromise instanceof Promise) {
						queryCache[key] ||= {
							date: Date.now(),
							hydrated: false,
							subscribers: new Set(),
							evictionTime,
						};
						queryCache[key] = {
							...queryCache[key]!,
							promise: valueOrPromise,
						};

						valueOrPromise.then((value) => {
							queryCache[key] = {
								...queryCache[key]!,
								value,
								hydrated: false,
								date: Date.now(),
							};
							delete queryCache[key]!.promise;

							queryCache[key]!.subscribers.forEach((subscriber) =>
								subscriber(),
							);
						});
					} else {
						queryCache[key] ||= {
							date: Date.now(),
							hydrated: false,
							subscribers: new Set(),
							evictionTime,
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
				subscribe(key, fn) {
					queryCache[key] ||= {
						subscribers: new Set(),
						date: Date.now(),
						hydrated: false,
						evictionTime: DEFAULT_EVICTION_TIME,
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
							if (queryCache[key]!.evictionTime === 0) {
								delete queryCache[key];
							} else if (isFinite(queryCache[key]!.evictionTime)) {
								queryCache[key]!.evictionTimeout = setTimeout(() => {
									delete queryCache[key];
								}, queryCache[key]!.evictionTime);
							}
						}
					};
				},
			}}
		>
			{app}
		</QueryCacheContext.Provider>
	);
}
