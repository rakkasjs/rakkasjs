import { useContext } from "react";
import { SsrCacheContext } from "../runtime/ssr-cache";

export function useQuery<T>(
	key: string,
	fn: () => T | Promise<T>,
): QueryResult<T> {
	const cache = useContext(SsrCacheContext);
	const item = cache.get(key);

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

type QueryResult<T> =
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
