/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/ban-types */
import { FC } from "react";
import { BaseRouterInfo } from "./router/Router";

export interface PageTypes {
	params: Record<string, string>;
	parentContext: Record<string, any>;
	data: any;
}

export type DefinePageTypes<T extends Partial<PageTypes>> = {
	params: T extends { params: any } ? T["params"] : never;
	parentContext: T extends { parentContext: any }
		? T["parentContext"]
		: RootContext;
	data: T extends { data: any } ? T["data"] : undefined;
};

export type DefinePageTypesUnder<
	P extends LayoutTypes,
	T extends Partial<PageTypes & { parentContext: never }> = {},
> = {
	params: T extends { params: any } ? T["params"] : never;
	parentContext: LayoutContext<P>;
	data: T extends { data: any } ? T["data"] : undefined;
};

export type DefaultPageTypes = DefinePageTypes<{
	params: never;
	parentContext: RootContext;
	data: undefined;
}>;

export interface LayoutTypes extends PageTypes {
	contextOverrides: Record<string, any>;
}

export type DefaultLayoutTypes = DefineLayoutTypes<{
	params: never;
	parentContext: RootContext;
	data: undefined;
}>;

export type DefineLayoutTypes<T extends Partial<LayoutTypes>> = {
	params: T extends { params: any } ? T["params"] : never;
	parentContext: T extends { parentContext: any }
		? T["parentContext"]
		: RootContext;
	data: T extends { data: any } ? T["data"] : undefined;
	contextOverrides: T extends { contextOverrides: any }
		? T["contextOverrides"]
		: Record<string, never>;
};

export type DefineLayoutTypesUnder<
	P extends LayoutTypes,
	T extends Partial<LayoutTypes & { parentContext: never }> = {},
> = {
	params: T extends { params: any } ? T["params"] : never;
	parentContext: LayoutContext<P>;
	data: T extends { data: any } ? T["data"] : undefined;
	contextOverrides: T extends { contextOverrides: any }
		? T["contextOverrides"]
		: Record<string, never>;
};

export interface GetCacheKeyArgs<T extends PageTypes = DefaultPageTypes> {
	/** Current URL  */
	url: URL;
	/** Matching path, i.e. "/aaa/[param]"  */
	match?: string;
	/** Current path parameters  */
	params: T["params"];
	/** Context passed down from parent layout load functions  */
	context: T["parentContext"];
}

export type GetCacheKeyFunc<T extends PageTypes = DefaultPageTypes> = (
	args: GetCacheKeyArgs<T>,
) => any;

export interface LoadArgs<T extends PageTypes = DefaultPageTypes>
	extends GetCacheKeyArgs<T> {
	/** Fetch function to make requests that includes credentials on both the client and the server */
	fetch: typeof fetch;
	/** Data loading helpers */
	helpers: LoadHelpers;
}

export interface LoadHelpers {}

export type PageLoadFunc<T extends PageTypes = DefaultPageTypes> = (
	args: LoadArgs<T>,
) => PageLoadResult<T["data"]> | Promise<PageLoadResult<T["data"]>>;

export type LayoutLoadFunc<T extends LayoutTypes = DefaultLayoutTypes> = (
	args: LoadArgs<T>,
) =>
	| LayoutLoadResult<T["data"], T["contextOverrides"]>
	| Promise<LayoutLoadResult<T["data"], T["contextOverrides"]>>;

/**
 * Props passed to a page component
 */
export interface PageProps<T extends PageTypes = DefaultPageTypes>
	extends GetCacheKeyArgs<T> {
	/** Data returned from the load function */
	data: T["data"];
	/** Reload function to invalidate current data and reload the page */
	reload(): void;
	/** Custom hook to invalidate current data and reload the page under certain circumstances */
	useReload(params: ReloadHookParams): void;
}

export interface ErrorPageProps<T extends PageTypes = DefaultPageTypes>
	extends Omit<PageProps<T>, "data"> {
	/** Error returned from the load function */
	error?: ErrorDescription;
	/** Data returned from the load function */
	data?: T["data"];
}

/** Utility type to extract the outgoing context type */
export type LayoutContext<T extends LayoutTypes> = Merge<
	T["parentContext"],
	T["contextOverrides"]
>;

/**
 * Props passed to a layout component
 */
export interface SimpleLayoutProps<T extends LayoutTypes = DefaultLayoutTypes>
	extends Omit<GetCacheKeyArgs<T>, "context"> {
	/** Context as returned from the load function */
	context: LayoutContext<T>;
	/** Data returned from the load function */
	data: T["data"];
	/** Reload function to invalidate current data and reload the page */
	reload(): void;
	/** Custom hook to invalidate current data and reload the page under certain circumstances */
	useReload(params: ReloadHookParams): void;
}

export interface LayoutProps<T extends LayoutTypes = DefaultLayoutTypes>
	extends Omit<SimpleLayoutProps<T>, "data"> {
	/** Error returned from the load function */
	error?: ErrorDescription;
	/** Data returned from the load function. May be unefined if an error has occured. */
	data?: T["data"];
}

export type Page<T extends PageTypes = DefaultPageTypes> = FC<PageProps<T>>;

export type ErrorPage<T extends PageTypes = DefaultPageTypes> = FC<
	ErrorPageProps<T>
>;

export type SimpleLayout<T extends LayoutTypes = DefaultLayoutTypes> = FC<
	SimpleLayoutProps<T>
>;

export type Layout<T extends LayoutTypes = DefaultLayoutTypes> = FC<
	LayoutProps<T>
>;

type Merge<A, B> = Flatten<
	B extends Record<string, never>
		? A
		: {
				[key in keyof A]: key extends keyof B ? any : A[key];
		  } & B
>;

type Flatten<T> = { [key in keyof T]: T[key] };

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
	| LoadErrorResult;

export type LayoutLoadResult<
	T = unknown,
	C extends Record<string, any> = Record<string, any>,
> = LayoutLoadSuccessResult<T, C> | LoadErrorResult;

export interface PageLoadSuccessResult<T = unknown> {
	/**  HTTP status, should be 2xx or 3xx for redirect */
	status?: number;
	/**  Data to be passed to the page component */
	data: T;
	/** Redirection target */
	location?: string | URL;
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
	/** Redirection target */
	location?: string | URL;
}

export interface LoadErrorResult {
	// HTTP status, should be 4xx or 5xx
	status?: number;
	// An error object describing the error
	error: ErrorDescription;
}

// Return value of useRouter custom hook
export interface RouterInfo extends BaseRouterInfo {
	params: Record<string, string>;
}

interface RawRequestBase {
	ip: string;
	url: URL;
	method: string;
	headers: Headers;
	originalIp: string;
	originalUrl: URL;
}

interface RakkasRequestBase<C = Record<string, unknown>>
	extends RawRequestBase {
	params: Record<string, string>;
	context: C;
}

interface EmptyBody {
	type: "empty";
	body?: undefined;
}

interface BinaryBody {
	type: "binary";
	body: Uint8Array;
}

interface TextBody {
	type: "text";
	body: string;
}

interface FormDataBody {
	type: "form-data";
	body: URLSearchParams;
}

interface JsonBody {
	type: "json";
	body: any;
}

export type RakkasRequestBodyAndType =
	| EmptyBody
	| TextBody
	| BinaryBody
	| FormDataBody
	| JsonBody;

export type RawRequest = RawRequestBase & RakkasRequestBodyAndType;
export type RakkasRequest<C = Record<string, unknown>> = RakkasRequestBase<C> &
	RakkasRequestBodyAndType;

export interface RakkasResponse {
	status?: number;
	headers?:
		| Record<string, string | string[] | undefined>
		| Array<[string, string | string[] | undefined]>;
	body?: unknown;
}

export type RequestHandler = (
	request: RakkasRequest,
) => RakkasResponse | Promise<RakkasResponse>;

export type RakkasMiddleware = (
	request: RakkasRequest,
	next: (request: RakkasRequest) => Promise<RakkasResponse>,
) => RakkasResponse | Promise<RakkasResponse>;

export interface RootContext {}

export type ServePageHook = (
	request: RawRequest,
	renderPage: (
		request: RawRequest,
		context?: RootContext,
		options?: PageRenderOptions,
	) => Promise<RakkasResponse>,
) => RakkasResponse | Promise<RakkasResponse>;

export interface PageRenderOptions {
	/** Wrap the rendered page in server-side providers */
	wrap?(page: JSX.Element): JSX.Element;
	/** Get extra HTML to be emitted to the head */
	getHeadHtml?(): string;
	/** Create the helpers object to be passed to load functions */
	createLoadHelpers?(
		fetch: typeof global.fetch,
	): LoadHelpers | Promise<LoadHelpers>;
	/** Custom rendering */
	renderToString?(app: JSX.Element): string | Promise<string>;
}
