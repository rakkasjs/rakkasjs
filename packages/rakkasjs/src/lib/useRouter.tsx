import React, { createContext, FC, useContext } from "react";
import { initClientGlobal } from "./init-global";
import { RouterInfo } from "./types";

// Make the context persist between hot reloads
const RakkasContext = initClientGlobal(
	"RakkasContext",
	createContext<RouterInfo>(undefined as any),
);

export const RouterProvider: FC<{ value: RouterInfo }> = (props) => {
	return <RakkasContext.Provider {...props} />;
};

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRouter(): RouterInfo {
	let context = useContext(RakkasContext);

	if (!context) {
		// eslint-disable-next-line no-console
		console.error("useRouter called outside of the render tree");

		context = {
			current: new URL(location.href),
			params: {},
		};
	}

	return context;
}
