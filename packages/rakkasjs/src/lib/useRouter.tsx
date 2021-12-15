import { useNavigationState } from "knave-react";
import { createContext, useContext } from "react";
import { initGlobal } from "./init-global";
import { RouterInfo } from "./types";

// Make the context persist between hot reloads
export const ParamsContext = initGlobal(
	"ParamsContext",
	createContext<{ params: Record<string, string> }>(undefined as any),
);

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRouter(): RouterInfo {
	const navigationState = useNavigationState();

	let context = useContext(ParamsContext);

	if (!context) {
		// eslint-disable-next-line no-console
		console.error("useRouter called outside of the render tree");

		context = {
			params: {},
		};
	}

	return {
		currentUrl: new URL(navigationState.currentUrl),
		pendingUrl: navigationState.pendingUrl
			? new URL(navigationState.pendingUrl)
			: undefined,
		params: context.params,
	};
}
