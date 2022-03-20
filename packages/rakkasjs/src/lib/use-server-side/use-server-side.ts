/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createContext, useContext } from "react";
import { QueryResult, useQuery } from "../use-query/use-query";
import { stringify } from "@brillout/json-s";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServerSideContext {}

export type ServerSideFunction<T> = (
	context: ServerSideContext,
) => T | Promise<T>;

function useSSQImpl(
	desc: [
		moduleId: string,
		counter: number,
		closure: any,
		fn: (...args: any) => any,
	],
): QueryResult<any> {
	const [moduleId, counter, closure] = desc;
	const context = useContext(ServerSideContextContext);

	const stringified = stringify(closure);
	const key = `$ss:${moduleId}:${counter}:${stringified}`;

	return useQuery(
		key,
		// @ts-ignore
		import.meta.env.SSR
			? () => desc[3](closure, context)
			: async () =>
					// TODO: Build ID
					fetch(
						"/_data/development/" +
							encodeURIComponent(moduleId) +
							"/" +
							counter +
							"/" +
							encodeURIComponent(stringified),
					).then(async (r) => {
						if (!r.ok) {
							throw new Error(r.statusText);
						}

						const text = await r.text();

						return (0, eval)("(" + text + ")");
					}),
	);
}

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
) => QueryResult<T> = useSSQImpl as any;

export const ServerSideContextContext = createContext<ServerSideContext>(
	undefined as any,
);
