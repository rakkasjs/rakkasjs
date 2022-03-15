import React, { ReactNode } from "react";
import { SsrCacheContext } from "../../lib/use-query/use-query";

declare const $RAKKAS_USE_QUERY_SSR_CACHE: Record<string, any>;

export function wrapApp(app: ReactNode): ReactNode {
	return (
		<SsrCacheContext.Provider
			value={{
				get: (key) => $RAKKAS_USE_QUERY_SSR_CACHE[key],
				set: (key, value) => ($RAKKAS_USE_QUERY_SSR_CACHE[key] = value),
			}}
		>
			{app}
		</SsrCacheContext.Provider>
	);
}
