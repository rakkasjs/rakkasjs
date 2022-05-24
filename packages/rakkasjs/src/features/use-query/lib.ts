import { useContext, useState, useSyncExternalStore } from "react";
import { SsrCacheContext } from "./implementation";

export function useQuery<T>(
	key: string,
	fn: () => T | Promise<T>,
): QueryResult<T> {
	const [, setInvalidator] = useState(0);

	const cache = useContext(SsrCacheContext);

	const item = useSyncExternalStore(
		() =>
			cache.subscribe(key, () => {
				setInvalidator((i) => (i + 1) & 0xffffffff);
			}),
		() => cache.get(key),
		() => cache.get(key),
	);

	// TODO: Implement SWR, background fetching etc.
	// TODO: Use useContextSelector https://github.com/dai-shi/use-context-selector

	if (item) {
		if (item[0] instanceof Promise) {
			throw item[0];
		}

		return {
			value: item[0],
			async refetch() {
				cache.set(key, Promise.resolve(fn()));
			},
			refetching: item[2] !== undefined,
		};
	}

	const promise = Promise.resolve(fn());
	cache.set(key, promise);
	throw promise;
}

export interface QueryResult<T> {
	value: T;
	refetch(): void;
	refetching: boolean;
}
