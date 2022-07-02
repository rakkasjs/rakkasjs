import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import { ServerSideFunction, UseServerSideQueryOptions } from "./lib-common";
import type { RequestContext } from "@hattip/compose";

function runSSMImpl(desc: [moduleId: string, counter: number, closure: any[]]) {
	const [moduleId, counter, closure] = desc;
	const stringified = closure.map((x) => stringify(x));

	return sendRequest(moduleId, counter, stringified, true);
}

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

function sendRequest(
	moduleId: string,
	counter: number,
	stringified: string[],
	usePostMethod: boolean,
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
				body: "[" + stringified.join(",") + "]",
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

export const runServerSideMutation: <T>(
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSMImpl as any;

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions,
) => QueryResult<T> = useSSQImpl as any;

export const runServerSideQuery: <T>(
	context: RequestContext | undefined,
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSQImpl as any;

export {
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	runServerSideQuery as runSSQ,
};
