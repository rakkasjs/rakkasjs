import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { escapeCss, escapeHtml } from "../../runtime/utils";
import { NormalizedHeadProps, mergeHeadProps } from "./implementation/merge";
import { defaultHeadProps } from "./implementation/defaults";
import { HeadContext } from "./implementation/context";
import { sortHeadTags } from "./implementation/sort";

const headServerHooks: ServerHooks = {
	createPageHooks(ctx) {
		const tags = ctx.rakkas.head;
		tags.keyed.base = {
			tagName: "base",
			href: ctx.url.pathname + ctx.url.search,
		};

		mergeHeadProps(tags, defaultHeadProps);

		return {
			wrapApp: (app) => {
				return <HeadContext.Provider value={tags}>{app}</HeadContext.Provider>;
			},
		};
	},
};

export default headServerHooks;

export function renderHeadContent(tags: NormalizedHeadProps) {
	const specialAttributes: {
		htmlAttributes: Record<string, string | number | boolean | undefined>;
		headAttributes: Record<string, string | number | boolean | undefined>;
		bodyAttributes: Record<string, string | number | boolean | undefined>;
	} = {
		htmlAttributes: {},
		headAttributes: {},
		bodyAttributes: {},
	};

	let result = "";

	const elements = sortHeadTags(tags);

	for (const element of elements) {
		const tagName = element.tagName;

		if (tagName === "head") {
			specialAttributes.headAttributes = element;
			continue;
		} else if (tagName === "body") {
			specialAttributes.bodyAttributes = element;
			continue;
		} else if (tagName === "html") {
			specialAttributes.htmlAttributes = element;
			continue;
		}

		result += renderElement(element);
	}

	result += "<!-- head end -->";

	return {
		specialAttributes,
		content: result,
	};
}

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
