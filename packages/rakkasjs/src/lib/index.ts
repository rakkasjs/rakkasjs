export type { ServerSideLocals, PageLocals, RequestContext } from "./types";

export type {
	Page,
	Layout,
	PageProps,
	LayoutProps,
	PreloadContext,
	PreloadResult,
	PreloadFunction,
	ServerSidePageContext,
	HeadersFunction,
	PrerenderFunction,
	PrerenderResult,
	PageRouteGuard,
	PageRouteGuardContext,
	LookupHookResult,
	ActionContext,
	ActionHandler,
	ActionResult,
} from "../runtime/page-types";

export * from "../runtime/common-hooks";

export * from "../features/head/lib";
export * from "../features/use-query/lib";
export * from "../features/use-mutation/lib";
export * from "../features/client-side-navigation/lib";
export * from "../features/client-only/lib";
export * from "../features/response-manipulation/lib";
export * from "../features/error-boundary/lib";

export * from "../features/run-server-side/lib-common";
export type {
	useSSQ,
	useServerSideQuery,
	runSSM,
	runServerSideMutation,
	runServerSideQuery,
	runSSQ,
	useServerSideMutation,
	useSSM,
	useFormMutation,
} from "../features/run-server-side/lib-client";

export type {
	startClient,
	ClientHooks,
	StartClientOptions,
} from "../runtime/client-entry";

export type {
	createRequestHandler,
	ServerHooks,
	PageRequestHooks as PageHooks,
} from "../runtime/hattip-handler";
