import { useContext } from "react";
import { RouteParamsContext } from "./route-params-context";

export { DefaultErrorPage } from "./DefaultErrorPage";

/**
 * Hook for getting the route parameters.
 */
export function useRouteParams(): Record<string, string> {
	return useContext(RouteParamsContext);
}
