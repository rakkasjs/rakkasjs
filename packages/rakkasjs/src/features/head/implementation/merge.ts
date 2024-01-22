import { HeadProps } from "./types";

export interface NormalizedHeadProps {
	keyed: Record<string, Attributes>;
	unkeyed: Array<Attributes>;
}

export type Attributes = Record<string, string | boolean | number | undefined>;

export function mergeHeadProps(
	target: NormalizedHeadProps,
	props: HeadProps,
): void {
	const { keyed, unkeyed } = target;
	for (const [key, def] of Object.entries(autoKeys) as Array<
		[
			keyof typeof autoKeys,
			[attributes: Attributes, target?: string] | "og" | "twitter",
		]
	>) {
		if (props[key] === undefined) {
			continue;
		}

		if (def === "og") {
			keyed[key] = {
				property: key,
				content: props[key] as string,
			};
			continue;
		}

		if (def === "twitter") {
			keyed[key] = {
				name: key,
				content: props[key] as string,
			};
			continue;
		}

		const [attributes, target] = def;

		if (target) {
			keyed[key] = {
				...attributes,
				[target]: props[key] as string,
			};
		} else {
			if (["html", "head", "body"].includes(attributes.tagName as string)) {
				if (keyed[key]) {
					assign(keyed[key], props[key] as Attributes);
					continue;
				}
			}

			keyed[key] = {
				...attributes,
				...(props[key] as Attributes),
			};
		}
	}

	for (const element of (props.elements ?? []) as any as Attributes[]) {
		const key = getKey(element);

		if (!key) {
			unkeyed.push(element);
			continue;
		}

		if (["html", "head", "body"].includes(key)) {
			assign(keyed[key], element);
			continue;
		}

		if (keyed[key]) {
			if (element.tagName === "remove") {
				delete keyed[key];
				continue;
			}
			assign(keyed[key], element);
		} else {
			if (element.tagName === "remove") {
				continue;
			}
			keyed[key] = element;
		}
	}
}

function getKey(attributes: Attributes): string | undefined {
	const tagName = attributes.tagName ?? "meta";

	if (attributes.key) {
		return attributes.key as string;
	} else if (tagName === "title") {
		return "title";
	} else if (tagName === "meta" && attributes.charset) {
		return "charset";
	} else if (tagName === "meta") {
		if (
			[
				"name",
				"description",
				"viewport",
				"twitter:card",
				"twitter:title",
				"twitter:description",
				"twitter:image",
			].includes(attributes.name as string)
		) {
			return attributes.name as string;
		}

		if (
			["og:title", "og:description", "og:image", "og:url", "og:type"].includes(
				attributes.property as string,
			)
		) {
			return attributes.property as string;
		}
	} else if (tagName === "link" && attributes.rel === "canonical") {
		return "canonical";
	} else if (tagName === "html") {
		return "html";
	} else if (tagName === "head") {
		return "head";
	} else if (tagName === "body") {
		return "body";
	}
}

function assign(target: Attributes, source: Attributes) {
	for (const key in source) {
		if (source[key] === undefined) {
			continue;
		}

		target[key] = source[key];
	}
}

const autoKeys: Record<
	| "title"
	| "viewport"
	| "description"
	| "canonical"
	| "og:title"
	| "og:description"
	| "og:image"
	| "og:url"
	| "og:type"
	| "twitter:card"
	| "twitter:title"
	| "twitter:description"
	| "twitter:image"
	| "htmlAttributes"
	| "headAttributes"
	| "bodyAttributes",
	| [
			attributes: { tagName: string; name?: string; rel?: string },
			target?: string,
	  ]
	| "og"
	| "twitter"
> = {
	title: [{ tagName: "title" }, "innerText"],
	viewport: [{ tagName: "meta", name: "viewport" }, "content"],
	description: [{ tagName: "meta", name: "description" }, "content"],
	canonical: [{ tagName: "link", rel: "canonical" }, "href"],
	"og:title": "og",
	"og:description": "og",
	"og:image": "og",
	"og:url": "og",
	"og:type": "og",
	"twitter:card": "twitter",
	"twitter:title": "twitter",
	"twitter:description": "twitter",
	"twitter:image": "twitter",
	htmlAttributes: [{ tagName: "html" }],
	headAttributes: [{ tagName: "head" }],
	bodyAttributes: [{ tagName: "body" }],
};
