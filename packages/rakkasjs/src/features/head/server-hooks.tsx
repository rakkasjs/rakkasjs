import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { escapeCss, escapeHtml } from "../../runtime/utils";
import { NormalizedHeadProps, mergeHeadProps } from "./implementation/merge";
import { defaultHeadProps } from "./implementation/defaults";
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

		mergeHeadProps(tags, defaultHeadProps);

		return {
			wrapApp: (app) => {
				return <HeadContext.Provider value={tags}>{app}</HeadContext.Provider>;
			},

			emitToDocumentHead(speciallAttributes) {
				let result = "";

				const elements = sortHeadTags(tags);

				for (const element of elements) {
					const { tagName = "meta", ...attributes } = element;
					if (tagName === "head") {
						speciallAttributes.headAttributes = attributes;
						continue;
					} else if (tagName === "body") {
						speciallAttributes.bodyAttributes = attributes;
						continue;
					} else if (tagName === "html") {
						speciallAttributes.htmlAttributes = attributes;
						continue;
					}

					result += renderElement(tagName as string, attributes);
				}

				return result + "<!-- head end -->";
			},
		};
	},
};

export default headServerHooks;

function renderElement(
	tagName: string,
	attributes: Record<string, string | number | boolean | undefined>,
) {
	let result = "<" + tagName;
	for (const [attr, value] of Object.entries(attributes)) {
		if (attr === "key") {
			continue;
		}

		if (
			attr === "textContent" ||
			attr === "innerHTML" ||
			attr === "children" ||
			attr === "tagName"
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
			tagName === "style"
				? escapeCss(String(value))
				: escapeHtml(String(value));
		result += `>${escaped}</${tagName}>`;
	} else if (attributes.innerHTML) {
		result += `>${String(attributes.innerHTML)}</${tagName}>`;
	} else if (attributes.children) {
		const children = (attributes.children as any as any[])
			.map((child) => renderElement(child.tagName ?? "meta", child))
			.join("");
		result += `>${children}</${tagName}>`;
	} else {
		result += `></${tagName}>`;
	}

	return result;
}
