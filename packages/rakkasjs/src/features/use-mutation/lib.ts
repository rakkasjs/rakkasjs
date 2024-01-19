import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "../use-query/implementation";

/** Function passed to useMutation */
export type MutationFunction<T, V> = (vars: V) => T | Promise<T>;

/** Options for useMutation */
export interface UseMutationOptions<T, V> {
	/** Called just before the mutation starts */
	onMutate?(vars: V): void | Promise<void>;
	/** Called when the mutation fails */
	onError?(error: unknown): void;
	/** Called when the mutation ends (either error or success) */
	onSettled?(data?: T, error?: unknown): void;
	/** Called when the mutation completes successfully */
	onSuccess?(data: T): void;
	/** Query tags to invalidate when the mutation settles */
	invalidateTags?:
		| string[]
		| Set<string>
		| ((data?: T, error?: unknown) => string[] | Set<string>);
}

/** Initial mutation state */
export interface UseMutationIdleResult {
	/** Mutation status */
	status: "idle";
	/** Data returned from the mutation */
	data?: undefined;
	/** Error thrown by the mutation */
	error?: undefined;
	/** Was there an error? */
	isError: false;
	/** Is the mutation in its initial state? */
	isIdle: true;
	/** Is the mutation currently underway? */
	isLoading: false;
	/** Did the last mutation complete successfully? */
	isSuccess: false;
}

/** Loading mutation state */
export interface UseMutationLoadingResult {
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
}

/** Failed mutation state */
export interface UseMutationErrorResult {
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
}

/** Successful mutation state */
export interface UseMutationSuccessResult<T> {
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
}

export interface UseMutationMethods<T, V> {
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and await its result */
	mutateAsync(vars: V): Promise<T>;
	/** Reset the mutation to its initial state */
	reset(): void;
}

/** Return value of useMutation */
export type UseMutationResult<T, V> = UseMutationMethods<T, V> &
	(
		| UseMutationIdleResult
		| UseMutationLoadingResult
		| UseMutationErrorResult
		| UseMutationSuccessResult<T>
	);

/**
 * Performs a mutation
 * @template T Type of mutation result data
 * @template V Type of mutation variables
 * @param mutationFn Function that performs the mutation
 * @param [options] Mutation options
 * @returns mutation Mutation result
 */
export function useMutation<T, V = void>(
	mutationFn: MutationFunction<T, V>,
	options: UseMutationOptions<T, V> = {},
): UseMutationResult<T, V> {
	const [status, setStatus] = useState<
		"idle" | "loading" | "error" | "success"
	>("idle");
	const [data, setData] = useState<T | undefined>(undefined);
	const [error, setError] = useState<unknown | undefined>(undefined);
	const resetRef = useRef(false);

	const { onMutate, onError, onSettled, onSuccess, invalidateTags } = options;

	const queryClient = useQueryClient();

	const doMutate = useCallback(
		async function doMutate(vars: V): Promise<T> {
			setStatus("loading");
			await onMutate?.(vars);
			try {
				const result = await mutationFn(vars);

				if (!resetRef.current) {
					onSuccess?.(result);
					setData(result);
					setStatus("success");
				}

				return result;
			} catch (err) {
				if (!resetRef.current) {
					onError?.(err);
					setError(err);
					setStatus("error");
				}

				throw err;
			} finally {
				if (!resetRef.current) {
					onSettled?.(data, error);
				}

				if (invalidateTags) {
					const tags =
						typeof invalidateTags === "function"
							? invalidateTags(data, error)
							: invalidateTags;
					queryClient.invalidateTags(tags);
				}
			}
		},
		[
			data,
			error,
			mutationFn,
			onError,
			onMutate,
			onSettled,
			onSuccess,
			invalidateTags,
			queryClient,
		],
	);

	const mutateAsync = useCallback(
		function mutateAsync(vars: V) {
			resetRef.current = false;
			return doMutate(vars);
		},
		[doMutate],
	);

	const reset = useCallback(function reset() {
		setStatus("idle");
		setData(undefined);
		setError(undefined);
		resetRef.current = true;
	}, []);

	const mutate = useCallback(
		function mutate(vars: V) {
			mutateAsync(vars).catch(() => {
				// Do nothing
			});
		},
		[mutateAsync],
	);

	return {
		status,
		data,
		error,
		isError: status === "error",
		isIdle: status === "idle",
		isLoading: status === "loading",
		isSuccess: status === "success",
		reset,
		mutateAsync,
		mutate,
	} as UseMutationResult<T, V>;
}

/** Optinos for useMutation */
export interface UseMutationsOptions<T, V> {
	/** Called just before the mutation starts */
	onMutate?(id: number, vars: V): void | Promise<void>;
	/** Called when the mutation fails */
	onError?(id: number, error: unknown): void;
	/** Called when the mutation ends (either error or success) */
	onSettled?(id: number, data?: T, error?: unknown): void;
	/** Called when the mutation completes successfully */
	onSuccess?(id: number, data: T): void;
	/** Query tags to invalidate when the mutation settles */
	invalidateTags?:
		| string[]
		| Set<string>
		| ((id: number, data?: T, error?: unknown) => string[] | Set<string>);
}

/** Return value of useMutations */
export interface UseMutationsResult<T, V> {
	/** Fire the mutation */
	mutate(vars: V): void;
	/** Fire the mutation and await its result */
	mutateAsync(vars: V): Promise<T>;
	/** Mutations that are currently underway */
	pending: { id: number; vars: V }[];
}

/**
 * Performs a mutation that can be fired multiple times at once. Each triggered
 * mutation will have a unique ID that can be used to track it in the `pending`
 * array in the return value. You can use `onSuccess`, `onError`, and
 * `onSettled` to track the status of each mutation to provide loading states
 * or optimistic updates.
 *
 * @template T Type of mutation result data
 * @template V Type of mutation variables
 * @param mutationFn Function that performs the mutation
 * @param [options] Mutation options
 * @returns Mutation result
 */
export function useMutations<T, V = void>(
	mutationFn: MutationFunction<T, V>,
	options: UseMutationsOptions<T, V> = {},
): UseMutationsResult<T, V> {
	const [pending, setPending] = useState<{ id: number; vars: V }[]>([]);
	const idRef = useRef(0);

	const queryClient = useQueryClient();

	async function mutate(vars: V) {
		const id = idRef.current++;
		setPending((pending) => [...pending, { id, vars }]);

		await options.onMutate?.(id, vars);

		let data: T | undefined;
		let error: unknown | undefined;

		try {
			data = await mutationFn(vars);

			options.onSuccess?.(id, data);

			return data;
		} catch (err) {
			error = err;
			options.onError?.(id, err);
		} finally {
			try {
				options.onSettled?.(id, data, error);
				if (options.invalidateTags) {
					const tags =
						typeof options.invalidateTags === "function"
							? options.invalidateTags(id, data, error)
							: options.invalidateTags;
					queryClient.invalidateTags(tags);
				}
			} finally {
				setPending((pending) => pending.filter((p) => p.id !== id));
			}
		}

		throw error;
	}

	return {
		mutate(vars) {
			mutate(vars).catch(() => {
				// Do nothing
			});
		},

		mutateAsync: mutate,

		pending,
	};
}
