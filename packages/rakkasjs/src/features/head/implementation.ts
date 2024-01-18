import { createNamedContext } from "../../runtime/named-context";
import { escapeHtml } from "../../runtime/utils";
import type { HeadProps } from "./lib";

export const HeadContext = createNamedContext<HeadProps>(
	"ServerHeadContext",
	{},
);

export const defaultHeadTags: HeadProps = {
	charset: "utf-8",
	viewport: "width=device-width, initial-scale=1",
	title: "Rakkas App",
	htmlAttributes: {},
	headAttributes: {},
	bodyAttributes: {},
};

export const clientHeadTags: HeadProps = { ...defaultHeadTags };

let updateScheduled = false;
let lastRendered: string | undefined;
export function scheduleHeadUpdate() {
	if (updateScheduled) {
		return;
	}
	updateScheduled = true;
	requestAnimationFrame(() => {
		const json = JSON.stringify(clientHeadTags);

		try {
			if (json === lastRendered) {
				return;
			}

			const updated = new Set<HTMLElement>();

			for (const [name, attributes] of Object.entries(clientHeadTags)) {
				if (name === "htmlAttributes") {
					handleAttributes(document.documentElement, attributes);
					continue;
				} else if (name === "headAttributes") {
					handleAttributes(document.head, attributes);
					continue;
				} else if (name === "bodyAttributes") {
					handleAttributes(document.body, attributes);
					continue;
				}

				delete clientHeadTags[name];

				let el: HTMLElement | null | undefined;

				if (typeof attributes === "string") {
					if (name === "charset") {
						el = select("meta[charset]");
						if (attributes === null) {
							el?.remove();
						} else if (el) {
							el.setAttribute("charset", attributes);
						} else {
							el = document.createElement("meta");
							el.setAttribute("charset", attributes);
							document.head.appendChild(el);
						}
					} else if (name === "title") {
						el = select("title");
						if (attributes === null) {
							el?.remove();
						} else if (el) {
							el.textContent = attributes;
						} else {
							el = document.createElement("title");
							el.textContent = attributes;
							document.head.appendChild(el);
						}
					} else if (name.startsWith("og:")) {
						el = select(`meta[property="${escapeHtml(name)}"]`);
						if (attributes === null) {
							el?.remove();
						} else if (el) {
							el.setAttribute("content", attributes);
						} else {
							el = document.createElement("meta");
							el.setAttribute("property", name);
							el.setAttribute("content", attributes);
							document.head.appendChild(el);
						}
					} else {
						el = select(`meta[name="${escapeHtml(name)}"]`);
						if (attributes === null) {
							el?.remove();
						} else if (el) {
							el.setAttribute("content", attributes);
						} else {
							el = document.createElement("meta");
							el.setAttribute("name", name);
							el.setAttribute("content", attributes);
							document.head.appendChild(el);
						}
					}
				} else {
					const tagName = attributes?.tagName ?? "meta";

					el = select(`${tagName}[data-rh="${escapeHtml(name)}"]`);
					if (attributes === null) {
						el?.remove();
					} else if (el) {
						for (const attr of el.attributes) {
							if (attr.name === "tagName") {
								continue;
							} else if (attr.name in attributes) {
								attr.value = attributes[attr.name];
							} else if (attr.name !== "data-rh") {
								el.removeAttribute(attr.name);
							}
						}
					} else {
						el = document.createElement(tagName);
						document.head.appendChild(el);
						for (const [attr, value] of Object.entries(attributes)) {
							if (attr === "tagName") {
								continue;
							}
							el.setAttribute(attr, value);
						}
						el.setAttribute("data-rh", name);
					}
				}

				if (el) updated.add(el);
			}

			for (const el of document.head.querySelectorAll(
				"title,meta,[data-rh]",
			) as NodeListOf<HTMLElement>) {
				if (!updated.has(el)) {
					el.remove();
				}
			}

			for (const name of Object.keys(clientHeadTags)) {
				delete clientHeadTags[name];
			}

			Object.assign(clientHeadTags, defaultHeadTags);
		} finally {
			lastRendered = json;
			updateScheduled = false;
		}
	});
}

function select(selector: string) {
	return document.head.querySelector(selector) as HTMLElement | null;
}

function handleAttributes(
	el: HTMLElement,
	attributes: Record<string, string> | null | string,
) {
	if (!attributes || typeof attributes === "string") {
		throw new Error(`Invalid attributes for ${el.tagName}: ${attributes}`);
	}

	for (const attr of el.attributes) {
		if (!(attr.name in attributes)) {
			el.removeAttribute(attr.name);
		}
	}

	for (const [attr, value] of Object.entries(attributes)) {
		el.setAttribute(attr, value);
	}
}
