import type { RouterInfo } from "./Router";
import { Context, createContext, useContext } from "react";

// Make the context persist between hot reloads
export let RouterContext: Context<RouterInfo>;

if (!import.meta.env.SSR && window.__RAKKAS_ROUTER_CONTEXT) {
	RouterContext = window.__RAKKAS_ROUTER_CONTEXT;
} else {
	RouterContext = createContext<RouterInfo>({
		current: new URL("https://example.com"),
	});

	if (!import.meta.env.SSR) {
		window.__RAKKAS_ROUTER_CONTEXT = RouterContext;
	}
}

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRouter(): RouterInfo {
	return useContext(RouterContext);
}
