import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import {
	ServerSideFunction,
	useServerSideContext,
	UseServerSideQueryOptions,
} from "./lib-common";
import devalue from "devalue";

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
	const ctx = useServerSideContext();
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

					await (ctx.platform as any).prerender(
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

export { useServerSideQuery as useSSQ, runServerSideMutation as runSSM };

function encodeBase64(str: string) {
	let encoded: string;

	if (typeof Buffer !== "undefined") {
		encoded = Buffer.from(str).toString("base64");
	} else {
		encoded = btoa(str);
	}

	return encoded.replace(/\//g, "_").replace(/\+/g, "-");
}
