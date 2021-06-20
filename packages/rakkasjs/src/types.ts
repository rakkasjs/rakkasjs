import { FC } from "react";
import { RouterInfo } from "./router/Router";

export interface PageTypes {
	params: Record<string, string>;
	parentContext: Record<string, any>;
	data: any;
}

export interface LayoutTypes extends PageTypes {
	contextOverrides: Record<string, any>;
}

export interface GetCacheKeyArgs<T extends PageTypes = PageTypes> {
	// Current URL
	url: URL;
	// Matching path, i.e. "/aaa/[param]"
	match?: string;
	// Current path parameters
	params: T["params"];
	// Context passed down from parent layout load functions
	context: T["parentContext"];
}

export type GetCacheKeyFunc<T extends PageTypes = PageTypes> = (
	args: GetCacheKeyArgs<T>,
) => any;

export interface LoadArgs<T extends PageTypes = PageTypes>
	extends GetCacheKeyArgs<T> {
	// Fetch function to make requests that includes credentials on both the client and the server
	fetch: typeof fetch;
}

export type PageLoadFunc<T extends PageTypes = PageTypes> = (
	args: LoadArgs<T>,
) => PageLoadResult<T["data"]> | Promise<PageLoadResult<T["data"]>>;

export type LayoutLoadFunc<T extends LayoutTypes = LayoutTypes> = (
	args: LoadArgs<T>,
) =>
	| LayoutLoadResult<T["data"], T["contextOverrides"]>
	| Promise<LayoutLoadResult<T["data"], T["contextOverrides"]>>;

/**
 * Props passed to a page component
 */
export interface PageProps<T extends PageTypes = PageTypes>
	extends GetCacheKeyArgs<T> {
	/** Data returned from the load function */
	data: T["data"];
	/** Reload function to invalidate current data and reload the page */
	reload(): void;
	/** Custom hook to invalidate current data and reload the page under certain circumstances */
	useReload(params: ReloadHookParams): void;
}

export interface ErrorPageProps<T extends PageTypes = PageTypes>
	extends Omit<PageProps, "data"> {
	/** Error returned from the load function */
	error?: ErrorDescription;
	/** Data returned from the load function */
	data?: T["data"];
}

/**
 * Props passed to a layout component
 */
export interface SimpleLayoutProps<T extends LayoutTypes = LayoutTypes>
	extends Omit<GetCacheKeyArgs<T>, "context"> {
	/** Context as returned from the load function */
	context: Merge<T["parentContext"], T["contextOverrides"]>;
	/** Data returned from the load function */
	data: T["data"];
	/** Reload function to invalidate current data and reload the page */
	reload(): void;
	/** Custom hook to invalidate current data and reload the page under certain circumstances */
	useReload(params: ReloadHookParams): void;
}

export interface LayoutProps<T extends LayoutTypes = LayoutTypes>
	extends Omit<SimpleLayoutProps, "data"> {
	/** Error returned from the load function */
	error?: ErrorDescription;
	/** Data returned from the load function. May be unefined if an error has occured. */
	data?: T["data"];
}

export type Page<T extends PageTypes = PageTypes> = FC<PageProps<T>>;

export type ErrorPage<T extends PageTypes = PageTypes> = FC<ErrorPageProps<T>>;

export type SimpleLayout<T extends LayoutTypes = LayoutTypes> = FC<
	SimpleLayoutProps<T>
>;

export type Layout<T extends LayoutTypes = LayoutTypes> = FC<LayoutProps<T>>;

type Merge<A, B> = {
	[key in keyof A]: key extends keyof B ? any : A[key];
} &
	B;

export interface PageComponentModule {
	default: Page | ErrorPage;
	load?: PageLoadFunc;
	getCacheKey?: GetCacheKeyFunc;
	pageOptions?: {
		canHandleErrors?: boolean;
	};
}

export interface PageDefinition {
	Component: Page | ErrorPage;
	load?: PageLoadFunc;
	getCacheKey?: GetCacheKeyFunc;
	options?: {
		canHandleErrors?: boolean;
	};
}

export interface PageDefinitionModule {
	default: PageDefinition;
}

export interface LayoutComponentModule {
	default?: Layout | SimpleLayout;
	load?: LayoutLoadFunc;
	getCacheKey?: GetCacheKeyFunc;
	layoutOptions?: {
		canHandleErrors?: boolean;
	};
}

export interface LayoutDefinition {
	Component: Layout | SimpleLayout;
	load?: LayoutLoadFunc;
	getCacheKey?: GetCacheKeyFunc;
	options?: {
		canHandleErrors?: boolean;
	};
}

export interface LayoutDefinitionModule {
	default: LayoutDefinition;
}

export type PageModule = PageComponentModule | PageDefinitionModule;
export type LayoutModule = LayoutComponentModule | LayoutDefinitionModule;

export type PageImporter = () => Promise<PageModule> | PageModule;
export type LayoutImporter = () => Promise<LayoutModule> | LayoutModule;

export interface ReloadHookParams {
	/**
	 * Reload when window receives focus
	 * @default false
	 * */
	focus?: boolean;
	/**
	 * Reload when the internet connection is restored after a disconnection
	 * @default false
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

/** Description of an error */
export interface ErrorDescription {
	message: string;
	status?: number;
	stack?: string;
	detail?: any;
}

export type PageLoadResult<T = unknown> =
	| PageLoadSuccessResult<T>
	| LoadErrorResult
	| LoadRedirectResult;

export type LayoutLoadResult<
	T = unknown,
	C extends Record<string, any> = Record<string, any>,
> = LayoutLoadSuccessResult<T, C> | LoadErrorResult | LoadRedirectResult;

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
	/** Status (can be changed in inner layouts/components) */
	status?: number;
	/** Data to be passed to the layout component */
	data: T;
	/** Context to be passed down to nested layouts and pages */
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

// Return value of useRakkas custom hook
export interface RakkasInfo extends RouterInfo {
	params: Record<string, string>;
	setRootContext(
		value:
			| Record<string, unknown>
			| ((old: Record<string, unknown>) => Record<string, unknown>),
	): void;
}
