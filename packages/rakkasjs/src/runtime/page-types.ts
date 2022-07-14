import { ComponentType, ReactNode } from "react";
import {
	QueryClient,
	PageContext,
	RedirectProps,
	ResponseHeadersProps,
	RequestContext,
} from "../lib";

export type PageImporter = () => Promise<PageModule>;

export type LayoutImporter = () => Promise<LayoutModule>;

export interface PageModule {
	default: Page;
	headers?: HeadersFunction;
}

export interface LayoutModule {
	default: Layout;
	headers?: HeadersFunction;
}

/** A page component */
export type Page<
	P = Record<string, string>,
	M = Record<string, unknown>,
> = ComponentType<PageProps<P, M>> & { preload?: PreloadFunction<P, M> };

/** A layout component */
export type Layout<
	P = Record<string, string>,
	M = Record<string, unknown>,
> = ComponentType<LayoutProps<P, M>> & { preload?: PreloadFunction<P, M> };

/** Props passed to a page component */
export interface PageProps<
	P = Record<string, string>,
	M = Record<string, unknown>,
> {
	/** Current URL */
	url: URL;
	/** Route parameters */
	params: P;
	/** Page meta data coming from the preload functions */
	meta: M;
}

/** Props passed to a layout component */
export interface LayoutProps<
	P = Record<string, string>,
	M = Record<string, unknown>,
> extends PageProps<P, M> {
	children: ReactNode;
}

/** Function called before loading a page or layout */
export type PreloadFunction<
	P = Record<string, string>,
	M = Record<string, unknown>,
> = (
	context: PreloadContext<P>,
) => PreloadResult<M> | void | Promise<PreloadResult<M> | void>;

/** Arguments passed to the preload function */
export interface PreloadContext<P = Record<string, string>>
	extends PageContext {
	/** Query client for accessing the query cache */
	queryClient: QueryClient;
	/** Current URL */
	url: URL;
	/** Route parameters */
	params: P;
}

/**
 * Arguments passed to server-side page functions like `headers`,
 * `prerender`, and `action`
 */
export type ServerSidePageContext<P = Record<string, string>> =
	PreloadContext<P> & {
		requestContext: RequestContext;
	};

/** The expected return type of a preload function */
export interface PreloadResult<M = Record<string, unknown>> {
	/** Metadata passed to page and layou components */
	meta?: Partial<M>;
	/** Head tags rendered for the page */
	head?: ReactNode;
	/** Redirection */
	redirect?: RedirectProps;
}

export interface PageRouteGuardContext<P = Record<string, string>>
	extends PageContext {
	params: P;
}

/** Type for the default export of page guards */
export type PageRouteGuard<P = Record<string, string>> = (
	ctx: PageRouteGuardContext<P>,
) => boolean;

type HeadersFunction<M = Record<string, unknown>> = (
	context: PreloadContext,
	meta: M,
) => ResponseHeadersProps | Promise<ResponseHeadersProps>;
