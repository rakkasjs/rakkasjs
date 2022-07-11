import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
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

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions,
) => QueryResult<T> = useSSQImpl as any;

export const runServerSideQuery: <T>(
	context: RequestContext | undefined,
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSQImpl as any;

export const runServerSideMutation: <T>(
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSMImpl as any;

export const useServerSideMutation: <T, V>(
	fn: (context: RequestContext, vars: V) => T | Promise<T>,
	options?: UseMutationOptions<T, V>,
) => UseMutationResult<T, V> = useSSMImpl as any;

export {
	runServerSideQuery as runSSQ,
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	useServerSideMutation as useSSM,
};
