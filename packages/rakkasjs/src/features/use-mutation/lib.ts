import { useRef, useState } from "react";

/** Function passed to useMutation */
export type MutationFunction<T, V> = (vars: V) => T | Promise<T>;

/** Optinos for useMutation */
export interface UseMutationOptions<T, V> {
	/** Called just before the mutation starts */
	onMutate?(vars: V): void | Promise<void>;
	/** Called when the mutation fails */
	onError?(error: unknown): void;
	/** Called when the mutation ends (either error or success) */
	onSettled?(data?: T, error?: unknown): void;
	/** Called when the mutation completes successfully */
	onSuccess?(data: T): void;
}

/** Initial mutation state */
export interface UseMutationIdleResult<T, V> {
	/** Mutation status */
	status: "idle";
	/** Data returned from the mutation */
	data?: undefined;
	/** Error thrown by from the mutation */
	error?: undefined;
	/** Was there an error? */
	isError: false;
	/** Is the mutation in its initial state? */
	isIdle: true;
	/** Is the mutation currently underway? */
	isLoading: false;
	/** Did the last mutation complete successfully? */
	isSuccess: false;
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and awaits its result */
	mutateAsync(vars: V): Promise<T>;
	/** Reset the mutation to its initial state */
	reset(): void;
}

/** Loading mutation state */
export interface UseMutationLoadingResult<T, V> {
	/** Mutation status */
	status: "loading";
	/** Data returned from the mutation */
	data?: undefined;
	/** Error thrown by from the mutation */
	error?: undefined;
	/** Was there an error? */
	isError: false;
	/** Is the mutation in its initial state? */
	isIdle: false;
	/** Is the mutation currently underway? */
	isLoading: true;
	/** Did the last mutation complete successfully? */
	isSuccess: false;
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and awaits its result */
	mutateAsync(vars: V): Promise<T>;
	/** Reset the mutation to its initial state */
	reset(): void;
}

/** Failed mutation state */
export interface UseMutationErrorResult<T, V> {
	/** Mutation status */
	status: "error";
	/** Data returned from the mutation */
	data?: undefined;
	/** Error thrown by from the mutation */
	error: unknown;
	/** Was there an error? */
	isError: true;
	/** Is the mutation in its initial state? */
	isIdle: false;
	/** Is the mutation currently underway? */
	isLoading: false;
	/** Did the last mutation complete successfully? */
	isSuccess: false;
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and awaits its result */
	mutateAsync(vars: V): Promise<T>;
	/** Reset the mutation to its initial state */
	reset(): void;
}

/** Successful mutation state */
export interface UseMutationSuccessResult<T, V> {
	/** Mutation status */
	status: "success";
	/** Data returned from the mutation */
	data: T;
	/** Error thrown by from the mutation */
	error?: undefined;
	/** Was there an error? */
	isError: false;
	/** Is the mutation in its initial state? */
	isIdle: false;
	/** Is the mutation currently underway? */
	isLoading: false;
	/** Did the last mutation complete successfully? */
	isSuccess: true;
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and awaits its result */
	mutateAsync(vars: V): Promise<T>;
	/** Reset the mutation to its initial state */
	reset(): void;
}

/** Return value of useMutation */
export type UseMutationResult<T, V> =
	| UseMutationIdleResult<T, V>
	| UseMutationLoadingResult<T, V>
	| UseMutationErrorResult<T, V>
	| UseMutationSuccessResult<T, V>;

/**
 * Performs a mutation
 * @template T Type of mutation result data
 * @template V Type of mutation variables
 * @param mutationFn Function that performs the mutation
 * @param [options] Mutation options
 * @returns mutation Mutation result
 */
export function useMutation<T, V>(
	mutationFn: MutationFunction<T, V>,
	options: UseMutationOptions<T, V> = {},
): UseMutationResult<T, V> {
	const [status, setStatus] = useState<
		"idle" | "loading" | "error" | "success"
	>("idle");
	const [data, setData] = useState<T | undefined>(undefined);
	const [error, setError] = useState<unknown | undefined>(undefined);
	const reset = useRef(false);

	async function doMutate(vars: V) {
		setStatus("loading");
		await options.onMutate?.(vars);
		try {
			const result = await mutationFn(vars);
			if (reset.current) {
				return;
			}

			options.onSuccess?.(result);
			setData(result);
			setStatus("success");
			return result;
		} catch (err) {
			if (reset.current) {
				return;
			}
			options.onError?.(err);
			setError(err);
			setStatus("error");
		} finally {
			if (!reset.current) {
				options.onSettled?.(data, error);
			}
		}
	}

	function mutate(vars: V) {
		reset.current = false;
		return doMutate(vars);
	}

	return {
		status,
		data,
		error,
		isError: status === "error",
		isIdle: status === "idle",
		isLoading: status === "loading",
		isSuccess: status === "success",
		reset() {
			setStatus("idle");
			setData(undefined);
			setError(undefined);
			reset.current = true;
		},
		mutateAsync: mutate,
		mutate(vars: V) {
			mutate(vars).catch(() => {
				// Do nothing
			});
		},
	} as any;
}
