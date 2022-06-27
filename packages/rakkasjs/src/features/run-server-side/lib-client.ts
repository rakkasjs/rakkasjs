import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import { ServerSideFunction } from "./lib-common";

function useSSQImpl(
	desc: [
		moduleId: string,
		counter: number,
		closure: any[],
		fn: (...args: any) => any,
	],
): QueryResult<any> {
	const [moduleId, counter, closure] = desc;

	const stringified = closure.map((x) => stringify(x));
	const key = `$ss:${moduleId}:${counter}:${stringified}`;

	return useQuery(key, async () => {
		let closurePath = stringified.map(encodeURIComponent).join("/");
		if (closurePath) closurePath = "/" + closurePath;

		// TODO: Build ID
		return fetch(
			"/_data/development/" +
				encodeURIComponent(moduleId) +
				"/" +
				counter +
				closurePath,
		).then(async (r) => {
			if (!r.ok) {
				throw new Error(r.statusText);
			}

			const text = await r.text();

			return (0, eval)("(" + text + ")");
		});
	});
}

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
) => QueryResult<T> = useSSQImpl as any;

export { useServerSideQuery as useSSQ };
