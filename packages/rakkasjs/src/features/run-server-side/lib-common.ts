import { stringify } from "@brillout/json-serializer/stringify";
import type { RequestContext } from "@hattip/compose";
import { FormEvent, useContext } from "react";
import {
	ActionResult,
	UseMutationErrorResult,
	UseMutationIdleResult,
	UseMutationLoadingResult,
	UseMutationSuccessResult,
	usePageContext,
} from "../../lib";
import { ServerSideContext } from "../../runtime/isomorphic-context";
import { encodeFileNameSafe } from "../../runtime/utils";
import { UseQueryOptions } from "../use-query/implementation";

/**
 * Hook for getting the request context. Returns undefined on the client.
 */
export function useRequestContext() {
	return useContext(ServerSideContext);
}

/** Callback passed to useServerSide/runServerside family of functions */
export type ServerSideFunction<T> = (context: RequestContext) => T | Promise<T>;

/** Options for {@link useServerSideQuery} */
export interface UseServerSideQueryOptions extends UseQueryOptions {
	/** Query key. Rakkas will generate a unique key if not provided. */
	key?: string;
	/**
	 * If true, a POST request will be sent instead of GET. It may be useful
	 * when the query requires a large amount of data to be sent from the
	 * client. The down side is that it cannot be prerendered so it shouldn't
	 * be used when rendering static pages.
	 */
	usePostMethod?: boolean;
}

export type UseFormMutationResult<T> = {
	action: string;
	submitHandler(event: FormEvent<HTMLFormElement>): void;
} & (
	| UseMutationIdleResult
	| UseMutationLoadingResult
	| UseMutationErrorResult
	| UseMutationSuccessResult<T>
);

export type UseFormMutationFn<T> = (
	context: RequestContext,
) => ActionResult<T> | Promise<ActionResult<T>>;

export function useFormAction(
	desc: [moduleId: string, counter: number, closure: any[]],
) {
	const { url } = usePageContext();

	const [moduleId, counter, closure] = desc;
	const stringified = closure.map((x) => stringify(x));

	let closurePath = stringified.map(encodeFileNameSafe).join("/");
	if (closurePath) closurePath = "/" + closurePath;

	const actionPath =
		import.meta.env.RAKKAS_BUILD_ID +
		"/" +
		encodeURIComponent(moduleId) +
		"/" +
		counter +
		closurePath;
	const actionUrl = new URL(url);
	actionUrl.searchParams.set("_action", actionPath);

	return actionUrl;
}
