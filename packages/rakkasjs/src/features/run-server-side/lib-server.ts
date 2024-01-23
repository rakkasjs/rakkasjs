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
import type { RequestContext } from "@hattip/compose";
import type {
	UseMutationOptions,
	UseMutationResult,
} from "../use-mutation/lib";
import { encodeFileNameSafe } from "../../runtime/utils";
import type { EventSourceResult } from "../use-query/implementation";

function runSSQImpl(
	ctx: RequestContext,
	desc: [callSiteId: string, closure: any[], fn: (...args: any) => any],
): Promise<any> {
	if (typeof desc === "function") {
		return Promise.reject(new Error("runSSQ call hasn't been transformed"));
	}

	const [callSiteId, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));

	return Promise.resolve(fn(closure, ctx)).then(async (result) => {
		if (process.env.RAKKAS_PRERENDER === "true") {
			let closurePath = stringified.map(encodeFileNameSafe).join("/");
			if (closurePath) closurePath = "/" + closurePath;

			const url = "/_app/data/" + callSiteId + closurePath + "/d.js";

			await (ctx.platform as any).render(
				url,
				new Response(uneval(result)),
				(ctx.platform as any).prerenderOptions,
			);
		}
		return result;
	});
}

function useSSEImpl(): EventSourceResult<any> {
	// No op
	return {};
}

function useSSQImpl(
	desc: [callSiteId: string, closure: any[], fn: (...args: any) => any],
	options: UseServerSideQueryOptions = {},
): QueryResult<any> {
	if (typeof desc === "function") {
		throw new Error("useSSQ call hasn't been transformed");
	}

	const { key: userKey, usePostMethod, ...useQueryOptions } = options;
	const ctx = useRequestContext();
	const [callSiteId, closure, fn] = desc;

	const stringified = closure.map((x) => stringify(x));
	const key = userKey ?? `$ss:${callSiteId}:${stringified}`;
	void usePostMethod;

	return useQuery(
		key,
		() =>
			Promise.resolve(fn(closure, ctx)).then(async (result) => {
				if (process.env.RAKKAS_PRERENDER === "true") {
					let closurePath = stringified.map(encodeFileNameSafe).join("/");
					if (closurePath) closurePath = "/" + closurePath;

					const url = "/_app/data/" + callSiteId + closurePath + "/d.js";

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
) => UseMutationResult<T, V> = () => ({
	mutate: throwServerMutationError,
	mutateAsync: throwServerMutationError,
	reset: throwServerMutationError,
	status: "idle",
	isError: false,
	isIdle: true,
	isLoading: false,
	isSuccess: false,
});

function throwServerMutationError(): never {
	throw new Error("Mutations cannot be called on the server");
}

export const composableActionData = new WeakMap<
	RequestContext,
	[route: string, data: any]
>();

function useFormMutationImpl<T>(
	desc: [callSiteId: string, closure: any[]],
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

export const useServerSideQuery: <
	T,
	Enabled extends boolean = true,
	InitialData extends T | undefined = undefined,
	PlaceholderData = undefined,
>(
	fn: ServerSideFunction<T>,
	options?: UseServerSideQueryOptions<T, Enabled, InitialData, PlaceholderData>,
) => QueryResult<T, Enabled, InitialData, PlaceholderData> = useSSQImpl as any;

export const runServerSideQuery: <T>(
	context: RequestContext | undefined,
	fn: ServerSideFunction<T>,
) => Promise<T> = runSSQImpl as any;

export const useServerSentEvents: <T>(
	fn: ServerSideFunction<AsyncIterable<T> | ReadableStream<T>>,
) => EventSourceResult<T> = useSSEImpl as any;

export {
	runServerSideQuery as runSSQ,
	useServerSideQuery as useSSQ,
	runServerSideMutation as runSSM,
	useServerSideMutation as useSSM,
	useServerSentEvents as useSSE,
};
