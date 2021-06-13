import { ComponentType } from "react";

/**
 * Props passed to a page or layout component
 */
export interface RakkasComponentProps<
	P extends Record<string, string> = Record<string, string>,
	D = unknown,
	C extends Readonly<Record<string, unknown>> = Readonly<
		Record<string, unknown>
	>,
> {
	/** Current URL */
	url: URL;
	/** Matching path, i.e. "/aaa/[param]" */
	match?: string;
	/** Current path parameters */
	params: P;
	/** Data returned from the load function */
	data: D;
	/** Context passed down from layout load functions */
	context: C;
	/** Reload function */
	reload(): void;
	/** Reload hook */
	useReload(params: ReloadHookParams): void;
}

/**
 * Props passed to a page or layout component that is capable of handling errors
 */
export interface ErrorHandlerProps<
	P extends Record<string, string> = Record<string, string>,
	D = unknown,
	C extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<RakkasComponentProps<P, D, C>, "data"> {
	/** Data returned from the load function. May not be present in case of error. */
	data?: D;
	/** Not present if there is no error */
	error?: ErrorDescription;
}

export interface ErrorDescription {
	message: string;
	status?: number;
	stack?: string;
}

export type PageLoadResult<T = unknown> =
	| PageLoadSuccessResult<T>
	| LoadErrorResult
	| LoadRedirectResult;

export type LayoutLoadResult<T = unknown> =
	| LayoutLoadSuccessResult<T>
	| LoadErrorResult
	| LoadRedirectResult;

export interface PageLoadSuccessResult<T = unknown> {
	// HTTP status, should be 2xx
	status?: number;
	// Data to be passed to the page component
	data: T;
}

export interface LayoutLoadSuccessResult<
	T = unknown,
	C extends Record<string, unknown> = Record<string, unknown>,
> {
	// Data to be passed to the layout component
	data: T;
	// Context to be passed down to nested layouts and pages
	context?: C;
}

export interface LoadErrorResult {
	// HTTP status, should be 4xx or 5xx
	status?: number;
	// An error object describing the error
	error: ErrorDescription;
}

export interface LoadRedirectResult {
	// HTTP status, should be 3xx
	status: number;
	// Location to redirect to
	location: string | URL;
}

export interface LoadArgs<
	P extends Record<string, string> = Record<string, string>,
	C extends Readonly<Record<string, unknown>> = Readonly<
		Record<string, unknown>
	>,
> {
	// Current URL
	url: URL;
	// Matching path, i.e. "/aaa/[param]"
	match?: string;
	// Current path parameters
	params: P;
	// Context passed down from layout load functions
	context: C;
	// Fetch function
	fetch: typeof fetch;
}

export interface PageModule {
	default: ComponentType<ErrorHandlerProps>;
	load?(loadArgs: LoadArgs): PageLoadResult | Promise<PageLoadResult>;
	options?: {
		canHandleErrors?: boolean;
	};
}

export interface LayoutModule {
	default: ComponentType<ErrorHandlerProps>;
	load?(loadArgs: LoadArgs): LayoutLoadResult | Promise<LayoutLoadResult>;
	options?: {
		canHandleErrors?: boolean;
	};
}

export type PageImporter = () => Promise<PageModule> | PageModule;
export type LayoutImporter = () => Promise<LayoutModule> | LayoutModule;

export interface RakkasResponse {
	status?: number;
	headers?: Record<string, string>;
	body?: unknown;
}

export interface ReloadHookParams {
	/**
	 * Reload when one of the values in this array change
	 * @default []
	 * */
	deps?: ReadonlyArray<unknown>;
	/**
	 * Set to true to reload immediately after hydration
	 * @default false
	 * */
	hydrate?: boolean;
	/**
	 * Reload when window receives focus
	 * @default false
	 * */
	focus?: boolean;
	/**
	 * Reload when the internet connection is restored after a disconnection
	 * @default true
	 * */
	reconnect?: boolean;
	/**
	 * Set to i.e. 15_000 to reload every 15 seconds
	 * @default false
	 * */
	interval?: number | false;
	/**
	 * Set to true to reload on interval even when the window has no focus
	 * @default false
	 * */
	background?: boolean;
}

export interface RawRequest {
	url: URL;
	method: string;
	headers: Headers;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	body: Uint8Array | string | any;
}

export interface RakkasRequest {
	url: URL;
	method: string;
	headers: Headers;
	params: Record<string, string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	body: Uint8Array | string | any;
	context: Record<string, unknown>;
}
