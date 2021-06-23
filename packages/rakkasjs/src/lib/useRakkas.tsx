import React, { createContext, FC, useContext } from "react";
import { RakkasInfo } from "./types";

const RakkasContext = createContext<RakkasInfo | null>(null);

export const RakkasProvider: FC<{ value: RakkasInfo | null }> = (props) => {
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
