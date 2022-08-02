import React, { ReactNode } from "react";
import { Helmet } from "react-helmet-async";

export interface HeadProps {
	async?: boolean;
	base?: any;
	bodyAttributes?: JSX.IntrinsicElements["body"] & {
		[key: string]: string | number | boolean | null | undefined;
	};
	children?: ReactNode;
	defaultTitle?: string;
	defer?: boolean;
	encodeSpecialCharacters?: boolean;
	htmlAttributes?: JSX.IntrinsicElements["html"] & {
		[key: string]: string | number | boolean | null | undefined;
	};
	onChangeClientState?: (
		newState: any,
		addedTags: HeadTags,
		removedTags: HeadTags,
	) => void;
	link?: JSX.IntrinsicElements["link"][];
	meta?: JSX.IntrinsicElements["meta"][];
	noscript?: Array<any>;
	script?: Array<any>;
	style?: Array<any>;
	title?: string;
	// eslint-disable-next-line @typescript-eslint/ban-types
	titleAttributes?: Object;
	titleTemplate?: string;
	prioritizeSeoTags?: boolean;
}

export interface HeadTags {
	baseTag: Array<any>;
	linkTags: Array<HTMLLinkElement>;
	metaTags: Array<HTMLMetaElement>;
	noscriptTags: Array<any>;
	scriptTags: Array<HTMLScriptElement>;
	styleTags: Array<HTMLStyleElement>;
}

export function Head(props: HeadProps) {
	return <Helmet {...props} />;
}
