/* eslint-disable @typescript-eslint/ban-types */
export interface HeadProps {
	viewport?: string;
	title?: string;
	description?: string;
	canonical?: string;
	"og:title"?: string;
	"og:description"?: string;
	"og:image"?: string;
	"og:url"?: string;
	"og:type"?: string;
	"twitter:card"?: string;
	"twitter:title"?: string;
	"twitter:description"?: string;
	"twitter:image"?: string;
	htmlAttributes?: CommonAttributes;
	headAttributes?: CommonAttributes;
	bodyAttributes?: CommonAttributes;
	elements?: HeadElement[];
}

export type HeadElement =
	| HtmlAttributes
	| HeadAttributes
	| BodyAttributes
	| TitleElement
	| MetaElement
	| BaseElement
	| LinkElement
	| StyleElement
	| ScriptElement
	| NoScriptElement
	| TemplateElement
	| RemoveElement;

export interface RemoveElement {
	tagName: "remove";
	key: string;
	remove: true;
}

export interface HtmlAttributes extends CommonAttributes {
	tagName: "html";
}

export interface HeadAttributes extends CommonAttributes {
	tagName: "head";
}

export interface BodyAttributes extends CommonAttributes {
	tagName: "body";
}

export interface TitleElement extends CommonAttributes {
	tagName: "title";
	textContent: string;
}

export type MetaElement =
	| MetaCharsetTag
	| MetaHttpEquivTag
	| MetaNameTag
	| MetaPropertyTag
	| MetaOgTag;

export interface MetaCharsetTag extends CommonAttributes {
	tagName?: "meta";
	charset: string;
	itemprop?: never;
}

export interface MetaHttpEquivTag extends CommonAttributes {
	tagName?: "meta";
	"http-equiv": string;
	content: string;
	itemprop?: never;
}

export interface MetaNameTag extends CommonAttributes {
	tagName?: "meta";
	name: string;
	content: string;
	itemprop?: never;
}

export interface MetaOgTag extends CommonAttributes {
	tagName?: "meta";
	property: string;
	content: string;
	itemprop?: never;
}

export interface MetaPropertyTag extends CommonAttributes {
	tagName?: "meta";
	itemprop: string;
	content: string;
}

export interface BaseElement extends CommonAttributes {
	tagName: "base";
	href: string;
	target?: "_blank" | "_self" | "_parent" | "_top" | (string & {}) | false;
}

export type LinkElement = PreloadLinkTag | StyleLinkTag | OtherLinkTag;

export type PreloadLinkTag = ImagePreloadLinkTag | OtherPreloadLinkTag;

export interface ImagePreloadLinkTag extends CommonLinkAttributes {
	tagName: "link";
	rel: "preload";
	as: "image";
	imagesizes?: string | false;
	imagesrcset?: string | false;
}

export interface OtherPreloadLinkTag extends CommonLinkAttributes {
	tagName: "link";
	rel: "preload";
	as:
		| "audio"
		| "document"
		| "embed"
		| "fetch"
		| "font"
		| "object"
		| "script"
		| "style"
		| "track"
		| "video"
		| "worker"
		| (string & {});
}

export interface StyleLinkTag extends CommonLinkAttributes {
	tagName: "link";
	rel: "stylesheet";
	disabled?: boolean;
}

export interface OtherLinkTag extends CommonLinkAttributes {
	tagName: "link";
	rel:
		| "alternate"
		| "archives"
		| "author"
		| "canonical"
		| "dns-prefetch"
		| "first"
		| "help"
		| "icon"
		| "index"
		| "last"
		| "license"
		| "manifest"
		| "modulepreload"
		| "next"
		| "pingback"
		| "preconnect"
		| "prefetch"
		| "preload"
		| "prev"
		| "search"
		| "shortlink"
		| "apple-touch-icon"
		| (string & {});
}

export interface CommonLinkAttributes extends CommonAttributes {
	blocking?: boolean;
	crossorigin?: "anonymous" | "use-credentials" | boolean;
	fetchpriority?: "auto" | "high" | "low" | false;
	href: string;
	hreflang?: string | false;
	integrity?: string | false;
	media?: string | false;
	referrerpolicy?:
		| "no-referrer"
		| "no-referrer-when-downgrade"
		| "origin"
		| "origin-when-cross-origin"
		| "same-origin"
		| "strict-origin"
		| "strict-origin-when-cross-origin"
		| "unsafe-url"
		| false;
	sizes?: string | false;
	type?: string | false;

	// Non-standard attributes
	color?: string | false;
}

export interface StyleElement extends CommonAttributes {
	tagName: "style";
	textContent: string;
	blocking?: boolean;
	media?: string | false;
	nonce?: string | false;
	title?: string | false;
}

export interface ScriptElement extends CommonAttributes {
	tagName: "script";
	async?: boolean;
	blocking?: boolean;
	crossorigin?: "anonymous" | "use-credentials" | boolean;
	defer?: boolean;
	fetchpriority?: "auto" | "high" | "low" | false;
	integrity?: string | false;
	nomodule?: boolean;
	referrerpolicy?:
		| "no-referrer"
		| "no-referrer-when-downgrade"
		| "origin"
		| "origin-when-cross-origin"
		| "same-origin"
		| "strict-origin"
		| "strict-origin-when-cross-origin"
		| "unsafe-url"
		| false;
	src?: string | false;
	type?: "importmap" | "module" | "text/javascript" | (string & {}) | false;
	textContent?: string;
}

export interface NoScriptElement extends CommonAttributes {
	tagName: "noscript";
	children: Array<
		| HtmlAttributes
		| HeadAttributes
		| BodyAttributes
		| MetaHttpEquivTag
		| MetaNameTag
		| BaseElement
		| LinkElement
		| StyleElement
		| ScriptElement
	>;
}

export interface TemplateElement extends CommonAttributes {
	tagName: "template";
	innerHTML: string;
	shadowroot?: "open" | "closed" | false;
}

export interface CommonAttributes {
	accesskey?: string | false;
	autocapitalize?:
		| "off"
		| "none"
		| "on"
		| "sentences"
		| "words"
		| "characters"
		| (string & {})
		| false;
	autofocus?: boolean;
	class?: string | false;
	contenteditable?: boolean;
	[key: `data-${string}`]: string | boolean;
	dir?: "ltr" | "rtl" | "auto" | (string & {}) | false;
	draggable?: boolean;
	enterkeyhint?:
		| "enter"
		| "done"
		| "go"
		| "next"
		| "previous"
		| "search"
		| "send"
		| (string & {})
		| false;
	exportparts?: string | false;
	hidden?: boolean;
	id?: string | false;
	inert?: boolean;
	inputmode?:
		| "decimal"
		| "email"
		| "none"
		| "numeric"
		| "search"
		| "tel"
		| "text"
		| "url"
		| (string & {})
		| false;
	is?: string | false;
	itemid?: string | false;
	itemprop?: string | false;
	itemref?: string | false;
	itemscope?: boolean;
	itemtype?: string | false;
	lang?: string | false;
	nonce?: string | false;
	part?: string | false;
	popover?: string | false;
	slot?: string | false;
	spellcheck?: boolean;
	style?: string | false;
	tabindex?: number;
	title?: string | false;
	translate?: "yes" | "no" | (string & {}) | false;
	virtualkeyboardpolicy?: "auto" | "manual" | (string & {}) | false;
	"xml:lang"?: string | false;
	"xmlns:base"?: string | false;
}
