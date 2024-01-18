import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { escapeHtml } from "../../runtime/utils";
import { defaultHeadTags, HeadContext } from "./implementation";
import { HeadProps } from "./lib";

const headServerHooks: ServerHooks = {
	createPageHooks() {
		const tags: HeadProps = { ...defaultHeadTags };

		return {
			wrapApp: (app) => {
				return <HeadContext.Provider value={tags}>{app}</HeadContext.Provider>;
			},

			emitToDocumentHead(speciallAttributes) {
				let result = "";

				const sorted = Object.entries(tags).sort(
					([ak, av], [bk, bv]) => rank(ak, av) - rank(bk, bv),
				);

				for (const [name, attributes] of sorted) {
					if (attributes === null) {
						continue;
					}

					if (typeof attributes === "string") {
						if (name === "charset") {
							result += `<meta charset="${escapeHtml(attributes)}">`;
						} else if (name === "title") {
							result += `<title>${escapeHtml(attributes)}</title>`;
						} else if (name.startsWith("og:")) {
							result += `<meta property="${escapeHtml(
								name,
							)}" content="${escapeHtml(attributes)}">`;
						} else {
							result += `<meta name="${escapeHtml(name)}" content="${escapeHtml(
								attributes,
							)}">`;
						}
					} else if (
						["htmlAttributes", "headAttributes", "bodyAttributes"].includes(
							name,
						)
					) {
						if (!attributes || typeof attributes === "string") {
							throw new Error(`Invalid ${name} attribute`);
						}
						Object.assign(
							speciallAttributes[name as keyof typeof speciallAttributes],
							attributes,
						);
					} else {
						const tagName = attributes?.tagName ?? "meta";

						result += "<" + tagName;
						for (const [attr, value] of Object.entries(attributes)) {
							if (attr === "tagName") {
								continue;
							}
							result += ` ${attr}="${escapeHtml(value)}"`;
						}
						result += ` data-rh="${escapeHtml(name)}">`;
					}
				}

				return result;
			},
		};
	},
};

export default headServerHooks;

function rank(k: string, v: string | Record<string, string> | null): number {
	if (k === "charset") {
		return 0;
	} else if (typeof v === "object" && v && "http-equiv" in v) {
		return 1;
	} else if (k === "viewport") {
		return 2;
	} else if (k === "title") {
		return 3;
	} else {
		return 4;
	}
}
