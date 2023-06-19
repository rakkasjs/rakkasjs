/* eslint-disable @typescript-eslint/ban-types */
import { ReactElement, useContext, useEffect } from "react";
import { HeadContext, scheduleHeadUpdate } from "./implementation";

export type HeadProps = Record<
	string,
	string | Record<string, string> | null
> & {
	tagName?: "meta" | "title" | "link";

	// Special cases
	charset?: string;
	title?: string;

	// Common head tags
	description?: string | null;
	author?: string | null;
	keywords?: string | null;
	"application-name"?: string | null;
	generator?: string | null;
	referrer?:
		| "no-referrer"
		| "origin"
		| "no-referrer-when-downgrade"
		| "origin-when-cross-origin"
		| "same-origin"
		| "strict-origin"
		| "strict-origin-when-cross-origin"
		| "unsafe-URL"
		| null;
	"theme-color"?: string | null;
	"color-scheme"?:
		| "normal"
		| "light"
		| "dark"
		| "light dark"
		| "dark light"
		| "only light"
		| null;
	creator?: string | null;
	robots?: string | null;
	googlebot?: string | null;
	viewport?: string | null;
	publisher?: string | null;

	// Common Open Graph tags
	"og:type"?: "website" | "article" | "book" | "profile" | null | (string & {});
	"og:title"?: string | null;
	"og:url"?: string | null;
	"og:description"?: string | null;
	"og:image"?: string | null;

	// Common Twitter tags
	"twitter:card"?: "summary" | "summary_large_image" | "app" | "player" | null;
	"twitter:site"?: string | null;
	"twitter:title"?: string | null;
	"twitter:description"?: string | null;
	"twitter:image"?: string | null;
};

export function Head(props: HeadProps): ReactElement {
	const tags = useContext(HeadContext);

	if (import.meta.env.SSR) {
		Object.assign(tags, props);
	} else {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useEffect(() => {
			for (const [name, value] of Object.entries(props)) {
				tags[name] = value;
			}

			scheduleHeadUpdate();
			return () => {
				for (const name of Object.keys(props)) {
					delete tags[name];
				}
				scheduleHeadUpdate();
			};
		});
	}

	return null as any;
}
