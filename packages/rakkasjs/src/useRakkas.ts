import { createContext, useContext } from "react";
import { RakkasInfo } from "./types";

export const RakkasContext = createContext<RakkasInfo | null>(null);

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRakkas(): RakkasInfo {
	const context = useContext(RakkasContext);

	if (!context) throw new Error("useRakkas called outside of render tree");

	return context;
}
