import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-serializer/stringify";
import { ServerSideFunction, UseServerSideQueryOptions } from "./lib-common";
import type { RequestContext } from "@hattip/compose";
import {
	useMutation,
	UseMutationOptions,
	UseMutationResult,
} from "../use-mutation/lib";

function runSSQImpl(
	_: RequestContext,
	desc: [moduleId: string, counter: number, closure: any[]],
	usePostMethod = false,
): any {
	const [moduleId, counter, closure] = desc;

	const stringified = closure.map((x) => stringify(x));

	return sendRequest(moduleId, counter, stringified, usePostMethod);
}

function useSSQImpl(
	desc: [moduleId: string, counter: number, closure: any[]],
	options: UseServerSideQueryOptions = {},
): QueryResult<any> {
	const [moduleId, counter, closure] = desc;
	const { key: userKey, usePostMethod = false, ...useQueryOptions } = options;

	const stringified = closure.map((x) => stringify(x));
	const key = userKey ?? `$ss:${moduleId}:${counter}:${stringified}`;

	return useQuery(
		key,
		() => sendRequest(moduleId, counter, stringified, usePostMethod),
		useQueryOptions,
	);
}

function runSSMImpl(
	desc: [moduleId: string, counter: number, closure: any[], vars?: any],
) {
	const [moduleId, counter, closure, vars] = desc;
	const stringified = closure.map((x) => stringify(x));

	return sendRequest(moduleId, counter, stringified, true, vars);
}

function useSSMImpl(
	desc: [moduleId: string, counter: number, closure: any[]],
	options?: UseMutationOptions<any, any>,
) {
	return useMutation((vars) => runSSMImpl([...desc, vars]), options);
}

function sendRequest(
	moduleId: string,
	counter: number,
	stringified: string[],
	usePostMethod: boolean,
	vars?: any,
) {
	let response: Promise<Response>;

	if (usePostMethod) {
		response = fetch(
			`/_data/${import.meta.env.RAKKAS_BUILD_ID}/` +
				encodeURIComponent(moduleId) +
				"/" +
				counter,
			{
				method: "POST",
				body:
					"[[" +
					stringified.join(",") +
					"]" +
					(vars !== undefined ? "," + stringify(vars) : "") +
					"]",
			},
		);
	} else {
		let closurePath = stringified
			.map((s) => btoa(s).replace(/\//g, "_").replace(/\+/g, "-"))
			.join("/");
		if (closurePath) closurePath = "/" + closurePath;

		response = fetch(
			`/_data/${import.meta.env.RAKKAS_BUILD_ID}/` +
				encodeURIComponent(moduleId) +
				"/" +
				counter +
				closurePath +
				"/d.js",
		);
	}

	return response.then(async (r) => {
		if (!r.ok) {
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
export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions,
) => QueryResult<T> = useSSQImpl as any;

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
	options?: UseMutationOptions<T, V>,
) => UseMutationResult<T, V> = useSSMImpl as any;

export {
	runServerSideQuery as runSSQ,
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	useServerSideMutation as useSSM,
};
