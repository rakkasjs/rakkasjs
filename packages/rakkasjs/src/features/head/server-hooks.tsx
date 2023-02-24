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

			emitToDocumentHead() {
				let result = "";

				for (const [name, attributes] of Object.entries(tags)) {
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
					} else {
						result = "<meta";
						for (const [attr, value] of Object.entries(attributes)) {
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
