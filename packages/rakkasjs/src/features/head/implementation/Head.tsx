import { ReactElement, useContext, useEffect } from "react";
import { HeadContext } from "./context";
import type { HeadProps } from "./types";
import { NormalizedHeadProps, mergeHeadProps } from "./merge";
import { defaultHeadProps } from "./defaults";
import { sortHeadTags } from "./sort";

export function useHead(props: HeadProps): void {
	const tags = useContext(HeadContext);

	if (import.meta.env.SSR) {
		mergeHeadProps(tags, props);
	}

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useEffect(() => {
		usedTags.add(props);
		scheduleUpdate();

		return () => {
			usedTags.delete(props);
			scheduleUpdate();
		};
	});
}

export function Head(props: HeadProps): ReactElement {
	useHead(props);
	return null as any;
}

const usedTags = new Set<HeadProps>();

let scheduled = false;
function scheduleUpdate() {
	if (scheduled) return;
	scheduled = true;
	requestAnimationFrame(updateHead);
}

function updateHead() {
	scheduled = false;

	const tags: NormalizedHeadProps = {
		keyed: {
			base: {
				tagName: "base",
				href: document.head.querySelector("base")?.href,
			},
		},
		unkeyed: [],
	};

	mergeHeadProps(tags, defaultHeadProps);

	for (const props of usedTags) {
		mergeHeadProps(tags, props);
	}

	const sorted = sortHeadTags(tags);

	// Delete all head tags
	for (const node of document.head.childNodes) {
		if (
			node.nodeType === Node.COMMENT_NODE &&
			node.nodeValue === " head end "
		) {
			while (node.previousSibling) {
				node.previousSibling.remove();
			}
			break;
		}
	}

	// Add new head tags
	let last = document.head.firstChild;
	for (const element of sorted.reverse()) {
		const { tagName = "meta", children, ...attributes } = element;

		if (tagName === "head") {
			setAttributes(document.head, attributes, true);
			continue;
		}

		if (tagName === "body") {
			setAttributes(document.body, attributes, true);
			continue;
		}

		if (tagName === "html") {
			setAttributes(document.documentElement, attributes, true);
			continue;
		}

		const el = document.createElement(tagName as string);
		setAttributes(el, attributes);

		// Only noscript can have children and if this is running, noscript has no effect
		void children;

		last = document.head.insertBefore(el, last);
	}
}

function setAttributes(
	el: HTMLElement,
	attributes: Record<string, string | number | boolean | undefined>,
	remove: boolean = false,
) {
	for (const [attr, value] of Object.entries(attributes)) {
		if (attr === "key") {
			continue;
		}

		if (attr === "innerText") {
			el.innerText = value as string;
			continue;
		}

		if (attr === "innerHTML") {
			el.innerHTML = value as string;
			continue;
		}

		if (value === false || value === undefined) {
			if (remove) {
				el.removeAttribute(attr);
			}
			continue;
		}

		if (value === true) {
			el.setAttribute(attr, attr);
			continue;
		}
		el.setAttribute(attr, String(value));
	}

	if (remove) {
		for (const attr of el.attributes) {
			if (!(attr.name in attributes)) {
				el.removeAttribute(attr.name);
			}
		}
	}
}
