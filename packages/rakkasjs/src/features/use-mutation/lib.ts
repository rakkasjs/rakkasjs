import { useRef, useState } from "react";

export type MutationFunction<T, V> = (vars: V) => T | Promise<T>;

export interface UseMutationOptions<T, V> {
	onMutate?(vars: V): void | Promise<void>;
	onError?(error: unknown): void;
	onSettled?(data?: T, error?: unknown): void;
	onSuccess?(data: T): void;
}

export interface UseMutationIdleResult<T, V> {
	status: "idle";
	data?: undefined;
	error?: undefined;
	isError: false;
	isIdle: true;
	isLoading: false;
	isSuccess: false;
	mutate(vars: V): void;
	mutateAsync(vars: V): Promise<T>;
	reset(): void;
}

export interface UseMutationLoadingResult<T, V> {
	status: "loading";
	data?: undefined;
	error?: undefined;
	isError: false;
	isIdle: false;
	isLoading: true;
	isSuccess: false;
	mutate(vars: V): void;
	mutateAsync(vars: V): Promise<T>;
	reset(): void;
}

export interface UseMutationErrorResult<T, V> {
	status: "error";
	data?: undefined;
	error: unknown;
	isError: true;
	isIdle: false;
	isLoading: false;
	isSuccess: false;
	mutate(vars: V): void;
	mutateAsync(vars: V): Promise<T>;
	reset(): void;
}

interface UseMutationSuccessResult<T, V> {
	status: "success";
	data: T;
	error?: undefined;
	isError: false;
	isIdle: false;
	isLoading: false;
	isSuccess: true;
	mutate(vars: V): void;
	mutateAsync(vars: V): Promise<T>;
	reset(): void;
}

export type UseMutationResult<T, V> =
	| UseMutationIdleResult<T, V>
	| UseMutationLoadingResult<T, V>
	| UseMutationErrorResult<T, V>
	| UseMutationSuccessResult<T, V>;

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
