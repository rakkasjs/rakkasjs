import { ComponentType, ReactElement, ReactNode } from "react";

export type Page = (props: PageProps) => ReactElement<any, any> | null;
export type Layout = (props: LayoutProps) => ReactElement<any, any> | null;

export interface PageProps<P = Record<string, string>> {
	url: URL;
	params: P;
}

export interface LayoutProps<P = Record<string, string>> {
	url: URL;
	params: P;
	children: ReactNode;
}

export interface PageModule {
	default: ComponentType<PageProps>;
}

export interface LayoutModule {
	default: ComponentType<LayoutProps>;
}
