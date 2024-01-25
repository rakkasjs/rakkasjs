import { useContext } from "react";
import { RouteParamsContext } from "./contexts";

export { DefaultErrorPage } from "./DefaultErrorPage";

/**
 * Hook for getting the route parameters.
 */
export function useRouteParams<T extends Record<string, string>>(): T {
	return useContext(RouteParamsContext) as T;
}
