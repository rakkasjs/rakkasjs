export {
	Link,
	NavLink,
	NavLinkProps,
	useRouter,
	RouterInfo,
	RouteRenderArgs,
	Router,
	RouterProps,
} from "bare-routes";

export interface LoadArgs {
	url: URL;
	params: Record<string, string>;
	fetch: typeof window.fetch;
}
