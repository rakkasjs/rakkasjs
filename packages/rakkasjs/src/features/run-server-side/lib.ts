/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createContext, useContext } from "react";
import { QueryResult, useQuery } from "../use-query/lib";
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
		closure: any[],
		fn: (...args: any) => any,
	],
): QueryResult<any> {
	const [moduleId, counter, closure] = desc;
	const context = useContext(ServerSideContextContext);

	const stringified = closure.map((x) => stringify(x));
	const key = `$ss:${moduleId}:${counter}:${stringified}`;

	return useQuery(
		key,
		// @ts-ignore
		import.meta.env.SSR
			? () => desc[3](closure, context)
			: async () => {
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
			  },
	);
}

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
) => QueryResult<T> = useSSQImpl as any;

const ServerSideContextContext = createContext<ServerSideContext>(
	undefined as any,
);

export { useServerSideQuery as useSSQ };
