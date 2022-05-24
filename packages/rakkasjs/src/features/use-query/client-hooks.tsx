import React, { ReactElement } from "react";
import { CacheItem, SsrCacheContext } from "./implementation";

declare const $RAKKAS_USE_QUERY_SSR_CACHE: Record<
	string,
	CacheItem | undefined
>;

export function wrapApp(app: ReactElement): ReactElement {
	return (
		<SsrCacheContext.Provider
			value={{
				get: (key) => $RAKKAS_USE_QUERY_SSR_CACHE[key],
				set: (key, promise) => {
					$RAKKAS_USE_QUERY_SSR_CACHE[key] ||= [promise] as any;
					$RAKKAS_USE_QUERY_SSR_CACHE[key]![2] = promise;
					$RAKKAS_USE_QUERY_SSR_CACHE[key]![1]?.forEach((fn) => fn());

					promise.then((value) => {
						$RAKKAS_USE_QUERY_SSR_CACHE[key]![0] = value;
						$RAKKAS_USE_QUERY_SSR_CACHE[key]![1]?.forEach((fn) => fn());
						$RAKKAS_USE_QUERY_SSR_CACHE[key]!.length = 2;
					});
				},
				subscribe(key, fn) {
					$RAKKAS_USE_QUERY_SSR_CACHE[key]![1] ||= new Set();
					$RAKKAS_USE_QUERY_SSR_CACHE[key]![1]!.add(fn);

					return () => {
						$RAKKAS_USE_QUERY_SSR_CACHE[key]![1]!.delete(fn);
					};
				},
			}}
		>
			{app}
		</SsrCacheContext.Provider>
	);
}
