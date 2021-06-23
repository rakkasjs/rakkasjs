import React, { createContext, FC, useContext } from "react";
import { RakkasInfo } from "./types";

const RakkasContext = createContext<RakkasInfo | null>(null);

export const RakkasProvider: FC<{ value: RakkasInfo | null }> = (props) => {
	return <RakkasContext.Provider {...props} />;
};

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRakkas(): RakkasInfo {
	const context = useContext(RakkasContext);

	if (!context) throw new Error("useRakkas called outside of render tree");

	return context;
}
