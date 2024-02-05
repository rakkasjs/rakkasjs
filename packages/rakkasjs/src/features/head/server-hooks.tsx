import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { escapeCss, escapeHtml } from "../../runtime/utils";
import { NormalizedHeadProps, mergeHeadProps } from "./implementation/merge";
import { currentDefaultHeadProps } from "./implementation/defaults";
import { HeadContext } from "./implementation/context";
import { sortHeadTags } from "./implementation/sort";

const headServerHooks: ServerHooks = {
	createPageHooks(ctx) {
		const tags: NormalizedHeadProps = {
			keyed: {
				base: {
					tagName: "base",
					href: ctx.url.pathname + ctx.url.search,
				},
			},
			unkeyed: [],
		};

		return {
			wrapApp: (app) => {
				mergeHeadProps(tags, currentDefaultHeadProps.current);
				return <HeadContext.Provider value={tags}>{app}</HeadContext.Provider>;
			},

			emitToDocumentHead: {
				order: "pre",

				handler(speciallAttributes) {
					let result = "<!-- head start -->";

					const elements = sortHeadTags(tags);

					for (const element of elements) {
						const tagName = element.tagName;

						if (tagName === "head") {
							speciallAttributes.headAttributes = element;
							continue;
						} else if (tagName === "body") {
							speciallAttributes.bodyAttributes = element;
							continue;
						} else if (tagName === "html") {
							speciallAttributes.htmlAttributes = element;
							continue;
						}

						result += renderElement(element);
					}

					return result + "<!-- head end -->";
				},
			},
		};
	},
};

export default headServerHooks;

function renderElement(
	attributes: Record<string, string | number | boolean | undefined>,
) {
	const tagName = (attributes.tagName ?? "meta") as string;

	let result = "<" + tagName;
	for (const [attr, value] of Object.entries(attributes)) {
		if (
			["key", "textContent", "innerHTML", "children", "tagName"].includes(attr)
		) {
			continue;
		}

		if (value === false || value === undefined) continue;

		if (value === true) {
			result += ` ${attr}`;
			continue;
		}
		result += ` ${attr}="${escapeHtml(String(value))}"`;
	}

	if (attributes.textContent) {
		const value = attributes.textContent;
		const escaped =
			tagName === "style" || tagName === "script"
				? escapeCss(String(value))
				: escapeHtml(String(value));
		result += `>${escaped}</${tagName}>`;
	} else if (attributes.innerHTML) {
		result += `>${String(attributes.innerHTML)}</${tagName}>`;
	} else if (attributes.children) {
		const children = (attributes.children as any as any[])
			.map((child) => renderElement(child))
			.join("");
		result += `>${children}</${tagName}>`;
	} else {
		result += ">";
		if (!["base", "link", "meta"].includes(tagName)) {
			result += `</${tagName}>`;
		}
	}

	return result;
}
