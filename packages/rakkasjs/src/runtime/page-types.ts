import { ComponentType, ReactNode } from "react";
import {
	QueryClient,
	QueryContext,
	RedirectProps,
	ResponseHeadersProps,
} from "../lib";

export interface PreloadContext<P = Record<string, string>>
	extends QueryContext {
	queryClient: QueryClient;
	url: URL;
	params: P;
}

export interface PreloadResult {
	meta?: Record<string, unknown>;
	head?: ReactNode;
	headers?: ResponseHeadersProps;
	redirect?: RedirectProps;
}

export type PreloadFunction = (
	context: PreloadContext,
) => PreloadResult | void | Promise<PreloadResult | void>;

export type Page = ComponentType<PageProps> & { preload?: PreloadFunction };
export type Layout = ComponentType<LayoutProps> & { preload?: PreloadFunction };

export interface PageProps<
	P = Record<string, string>,
	M = Record<string, unknown>,
> {
	url: URL;
	params: P;
	meta: M;
}

export interface LayoutProps<
	P = Record<string, string>,
	M = Record<string, unknown>,
> {
	children: ReactNode;
	url: URL;
	params: P;
	meta: M;
}

export interface PageModule {
	default: Page;
}

export interface LayoutModule {
	default: Layout;
}
