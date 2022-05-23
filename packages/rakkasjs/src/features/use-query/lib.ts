import { useContext } from "react";
import { SsrCacheContext } from "./internal/context";

export function useQuery<T>(
	key: string,
	fn: () => T | Promise<T>,
): QueryResult<T> {
	const cache = useContext(SsrCacheContext);
	const item = cache.get(key);

	// TODO: Implement SWR, background fetching etc.
	// TODO: Use useContextSelector https://github.com/dai-shi/use-context-selector

	if (item) {
		return item[0]
			? ({ success: true, value: item[1] } as any)
			: ({ success: false, error: item[1] } as any);
	}

	throw (async () => {
		try {
			const value = await fn();
			cache.set(key, [1, value]);
		} catch (error) {
			// TODO: Don't leak server errors
			cache.set(key, [0, error]);
		}
	})();
}

export type QueryResult<T> =
	| {
			success: true;
			value: T;
			error?: undefined;
	  }
	| {
			success: false;
			value?: undefined;
			error: unknown;
	  };
