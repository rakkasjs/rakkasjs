import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-s";
import { ServerSideFunction, useServerSideContext } from "./lib-common";

function useSSQImpl(
	desc: [
		moduleId: string,
		counter: number,
		closure: any[],
		fn: (...args: any) => any,
	],
): QueryResult<any> {
	const context = useServerSideContext();
	const [moduleId, counter, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));
	const key = `$ss:${moduleId}:${counter}:${stringified}`;

	return useQuery(key, () => fn(closure, context));
}

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
) => QueryResult<T> = useSSQImpl as any;

export { useServerSideQuery as useSSQ };
