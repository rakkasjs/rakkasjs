import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import {
	ServerSideFunction,
	useRequestContext,
	UseServerSideQueryOptions,
} from "./lib-common";
import devalue from "devalue";
import { RequestContext } from "@hattip/compose";

function runSSQImpl(
	ctx: RequestContext,
	desc: [
		moduleId: string,
		counter: number,
		closure: any[],
		fn: (...args: any) => any,
	],
): Promise<any> {
	const [moduleId, counter, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));

	return Promise.resolve(fn(closure, ctx)).then(async (result) => {
		if (process.env.RAKKAS_PRERENDER === "true") {
			let closurePath = stringified.map(encodeBase64).join("/");
			if (closurePath) closurePath = "/" + closurePath;

			const url =
				`/_data/${import.meta.env.RAKKAS_BUILD_ID}/` +
				moduleId +
				"/" +
				counter +
				closurePath +
				"/d.js";

			await (ctx.platform as any).render(url, new Response(devalue(result)));
		}
		return result;
	});
}

function useSSQImpl(
	desc: [
		moduleId: string,
		counter: number,
		closure: any[],
		fn: (...args: any) => any,
	],
	options: UseServerSideQueryOptions = {},
): QueryResult<any> {
	const { key: userKey, usePostMethod, ...useQueryOptions } = options;
	const ctx = useRequestContext();
	const [moduleId, counter, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));
	const key = userKey ?? `$ss:${moduleId}:${counter}:${stringified}`;
	void usePostMethod;

	return useQuery(
		key,
		() =>
			Promise.resolve(fn(closure, ctx)).then(async (result) => {
				if (process.env.RAKKAS_PRERENDER === "true") {
					let closurePath = stringified.map(encodeBase64).join("/");
					if (closurePath) closurePath = "/" + closurePath;

					const url =
						`/_data/${import.meta.env.RAKKAS_BUILD_ID}/` +
						moduleId +
						"/" +
						counter +
						closurePath +
						"/d.js";

					await (ctx!.platform as any).render(
						url,
						new Response(devalue(result)),
					);
				}
				return result;
			}),
		useQueryOptions,
	);
}

export const runServerSideMutation: <T>(
	fn: ServerSideFunction<T>,
) => Promise<T> = () => {
	throw new Error("runServerSideMutation is not available on the server-side");
};

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

function encodeBase64(str: string) {
	let encoded: string;

	if (typeof Buffer !== "undefined") {
		encoded = Buffer.from(str).toString("base64");
	} else {
		encoded = btoa(str);
	}

	return encoded.replace(/\//g, "_").replace(/\+/g, "-");
}
