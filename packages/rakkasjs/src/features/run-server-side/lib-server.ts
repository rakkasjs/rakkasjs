import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import {
	ServerSideFunction,
	useServerSideContext,
	UseServerSideQueryOptions,
} from "./lib-common";

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
	const context = useServerSideContext();
	const [moduleId, counter, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));
	const key = userKey ?? `$ss:${moduleId}:${counter}:${stringified}`;
	void usePostMethod;

	return useQuery(key, () => fn(closure, context), useQueryOptions);
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
