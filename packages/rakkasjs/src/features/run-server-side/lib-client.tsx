import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-serializer/stringify";
import {
	RunServerSideMutationOptions,
	RunServerSideQueryOptions,
	ServerSideFunction,
	useFormAction,
	UseFormMutationFn,
	UseFormMutationResult,
	UseServerSideMutationOptions,
	UseServerSideQueryOptions,
} from "./lib-common";
import type { RequestContext } from "@hattip/compose";
import {
	useMutation,
	UseMutationOptions,
	UseMutationResult,
} from "../use-mutation/lib";
import { encodeFileNameSafe } from "../../runtime/utils";
import { useSubmit } from "../client-side-navigation/implementation";
import { EventSourceResult, useEventSource } from "../use-query/implementation";

function runSSQImpl(
	_: RequestContext,
	desc: [callSiteId: string, closure: any[]],
	usePostMethod = false,
): any {
	const [callSiteId, closure] = desc;

	const stringified = closure.map((x) => stringify(x));

	return sendRequest(callSiteId, stringified, usePostMethod);
}

function useSSQImpl(
	desc: [callSiteId: string, closure: any[]],
	options: UseServerSideQueryOptions = {},
): QueryResult<any> {
	const [callSiteId, closure] = desc;
	const { key: userKey, usePostMethod = false, ...useQueryOptions } = options;

	const stringified = closure.map((x) => stringify(x));
	const key = userKey ?? `$ss:${callSiteId}:${stringified}`;

	return useQuery(
		key,
		() => sendRequest(callSiteId, stringified, usePostMethod),
		useQueryOptions,
	);
}

function useSSEImpl(
	desc: [callSiteId: string, closure: any[]],
): EventSourceResult<any> {
	const [callSiteId, closure] = desc;

	const stringified = closure.map((x) => stringify(x));
	let closurePath = stringified.map(encodeFileNameSafe).join("/");
	if (closurePath) closurePath = "/" + closurePath;

	const url = "/_data/" + callSiteId + closurePath + "/d.js";

	return useEventSource(url);
}

function runSSMImpl(desc: [callSiteId: string, closure: any[], vars?: any]) {
	const [callSiteId, closure, vars] = desc;
	const stringified = closure.map((x) => stringify(x));

	return sendRequest(callSiteId, stringified, true, vars);
}

function useFormMutationImpl<T>(
	desc: [callSiteId: string, closure: any[]],
	options?: UseMutationOptions<T, any>,
): UseFormMutationResult<T> {
	const action = useFormAction(desc).href;
	const submit = useSubmit(options);

	return {
		action,
		...submit,
	};
}

function useSSMImpl(
	desc: [callSiteId: string, closure: any[]],
	options?: UseMutationOptions<any, any>,
) {
	return useMutation((vars) => runSSMImpl([...desc, vars]), options);
}

function sendRequest(
	callSiteId: string,
	stringified: string[],
	usePostMethod: boolean,
	vars?: any,
) {
	let response: Promise<Response>;

	if (usePostMethod) {
		response = fetch("/_data/" + callSiteId, {
			method: "POST",
			body:
				"[[" +
				stringified.join(",") +
				"]" +
				(vars !== undefined ? "," + stringify(vars) : "") +
				"]",
			headers: {
				"Content-Type": "application/json",
			},
		});
	} else {
		let closurePath = stringified.map(encodeFileNameSafe).join("/");
		if (closurePath) closurePath = "/" + closurePath;

		response = fetch("/_data/" + callSiteId + closurePath + "/d.js");
	}

	return response.then(async (r) => {
		if (!r.ok) {
			if (r.status === 404) {
				// Outdated build, try a hard reload
				window.location.reload();
				await new Promise(() => {
					// Wait forever
				});
			}

			const message = await r.text();
			throw new Error(message || r.statusText);
		}

		const text = await r.text();

		return (0, eval)("(" + text + ")");
	});
}

/**
 * Hook for running a piece of code on the server to fetch data. The callback
 * will always run on the server. When the hook is rendered on the client,
 * Rakkas will send a request to the server. You can think of this hook as a
 * convenience wrapper around {@link useQuery} and {@link runServerSideQuery}.
 *
 * @param fn The function to run on the server
 * @param options Options for the query
 */
export const useServerSideQuery: <
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions<T, Enabled, InitialData, PlaceholderData>,
) => QueryResult<T, Enabled, InitialData, PlaceholderData> = useSSQImpl as any;

/**
 * Runs a piece of code on the server. The callback will always run the server.
 * When the hook is rendered on the client, Rakkas will send a request to the
 * server.
 *
 * @param context The request context
 * @param fn The function to run on the server
 * @param options Options for the query
 */
export const runServerSideQuery: <T>(
	context: RequestContext | undefined,
	fn: ServerSideFunction<T>,
	options?: RunServerSideQueryOptions,
) => Promise<T> = runSSQImpl as any;

/**
 * Runs a piece of code on the server. The callback will always run the server.
 * When the hook is rendered on the client, Rakkas will send a request to the
 * server. The difference between this and {@link runServerSideQuery} is that
 * `runServerSideMutation` can only run on the client and, as such, it doesn't
 * need a request context argument.
 *
 * @param fn The function to run on the server
 */
export const runServerSideMutation: <T>(
	fn: ServerSideFunction<T>,
	options?: RunServerSideMutationOptions,
) => Promise<T> = runSSMImpl as any;

/**
 * Hook for running a piece of code on the server to modify some data. When the
 * hook is rendered, Rakkas will send a request to the server and the callback
 * will always run on the server. You can think of this hook as a convenience
 * wrapper around {@link useMutation} and {@link runServerSideMutation}.
 *
 * @param fn The function to run on the server
 * @param options Options for the mutation
 */
export const useServerSideMutation: <T, V = void>(
	fn: (context: RequestContext, vars: V) => T | Promise<T>,
	options?: UseServerSideMutationOptions<T, V>,
) => UseMutationResult<T, V> = useSSMImpl as any;

export const useFormMutation: <T>(
	fn: UseFormMutationFn<T>,
	options?: UseServerSideMutationOptions<T, void>,
) => UseFormMutationResult<T> = useFormMutationImpl as any;

export const useServerSentEvents: <T>(
	fn: ServerSideFunction<ReadableStream<T>>,
) => EventSourceResult<T> = useSSEImpl as any;

export {
	runServerSideQuery as runSSQ,
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	useServerSideMutation as useSSM,
	useServerSentEvents as useSSE,
};
