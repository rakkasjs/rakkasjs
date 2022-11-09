import { QueryResult, useQuery } from "../use-query/lib";
import { stringify } from "@brillout/json-serializer/stringify";
import {
	ServerSideFunction,
	useFormAction,
	UseFormMutationResult,
	useRequestContext,
	UseServerSideQueryOptions,
} from "./lib-common";
import { uneval } from "devalue";
import { RequestContext } from "@hattip/compose";
import { UseMutationOptions, UseMutationResult } from "../use-mutation/lib";
import { encodeFileNameSafe } from "../../runtime/utils";

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
			let closurePath = stringified.map(encodeFileNameSafe).join("/");
			if (closurePath) closurePath = "/" + closurePath;

			const url =
				`/_data/${import.meta.env.RAKKAS_BUILD_ID}/` +
				moduleId +
				"/" +
				counter +
				closurePath +
				"/d.js";

			await (ctx.platform as any).render(
				url,
				new Response(uneval(result)),
				(ctx.platform as any).prerenderOptions,
			);
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
					let closurePath = stringified.map(encodeFileNameSafe).join("/");
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
						new Response(uneval(result)),
						(ctx!.platform as any).prerenderOptions,
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

export const useServerSideMutation: <T, V = void>(
	fn: (context: RequestContext, vars: V) => T | Promise<T>,
	options?: UseMutationOptions<T, V>,
) => UseMutationResult<T, V> = (() => {
	// No op
}) as any;

export const composableActionData = new WeakMap<
	RequestContext,
	[route: string, data: any]
>();

function useFormMutationImpl<T>(
	desc: [moduleId: string, counter: number, closure: any[]],
): UseFormMutationResult<T> {
	const action = useFormAction(desc);
	const ctx = useRequestContext()!;
	const dataContainer = composableActionData.get(ctx);
	const hasData = !!(
		dataContainer && dataContainer[0] === action.searchParams.get("_action")
	);

	return {
		action: action.href,
		status: hasData ? "success" : "idle",
		isError: false,
		isIdle: !hasData,
		isLoading: false,
		isSuccess: hasData,
		submitHandler() {
			throw new Error("submitHandler is not available on the server-side");
		},
		data: hasData ? dataContainer![1].data : undefined,
		error: undefined,
	} as UseFormMutationResult<T>;
}

export const useFormMutation: <T>(
	fn: (ctx: RequestContext) => any,
) => UseFormMutationResult<T> = useFormMutationImpl as any;

export const useServerSideQuery: <T>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions,
) => QueryResult<T> = useSSQImpl as any;

export const runServerSideQuery: <T>(
	context: RequestContext | undefined,
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSQImpl as any;

export {
	runServerSideQuery as runSSQ,
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	useServerSideMutation as useSSM,
};
