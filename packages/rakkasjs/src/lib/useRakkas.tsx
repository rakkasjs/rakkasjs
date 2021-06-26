import React, { createContext, FC, useContext, Context } from "react";
import { RakkasInfo } from "./types";

// Make the context persist between hot reloads
let RakkasContext: Context<RakkasInfo>;

if (!import.meta.env.SSR && window.__RAKKAS_RAKKAS_CONTEXT) {
	RakkasContext = window.__RAKKAS_RAKKAS_CONTEXT;
} else {
	RakkasContext = createContext<RakkasInfo>(undefined as any);

	if (!import.meta.env.SSR) {
		window.__RAKKAS_RAKKAS_CONTEXT = RakkasContext;
	}
}

export const RakkasProvider: FC<{ value: RakkasInfo }> = (props) => {
	return <RakkasContext.Provider {...props} />;
};

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRakkas(): RakkasInfo {
	let context = useContext(RakkasContext);

	if (!context) {
		// eslint-disable-next-line no-console
		console.error("useRakkas called outside of render tree");

		context = {
			current: new URL(location.href),
			navigate: () => false,
			params: {},
			setRootContext: () => undefined,
		};
	}

	return context;
}
