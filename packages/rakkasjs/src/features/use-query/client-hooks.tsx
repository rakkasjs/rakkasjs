import React, { ReactElement } from "react";
import { SsrCacheContext } from "./implementation";

declare const $RAKKAS_USE_QUERY_SSR_CACHE: Record<string, any>;

export function wrapApp(app: ReactElement): ReactElement {
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
