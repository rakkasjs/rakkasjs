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

	let newElements = sortHeadTags(tags);

	// Handle <html>, <head>, and <body>
	for (const element of newElements) {
		const { tagName, ...attributes } = element;

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
	}

	newElements = newElements.filter(
		(elt) => !["head", "body", "html"].includes(elt.tagName as string),
	);

	const currentElements: HTMLElement[] = [];
	let endNode: Node | null = null;
	for (const node of document.head.childNodes) {
		if (
			node.nodeType === Node.COMMENT_NODE &&
			node.nodeValue === " head end "
		) {
			endNode = node;
			break;
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			currentElements.push(node as HTMLElement);
		}
	}

	let iNew = 0;
	let iCur = 0;
	while (iNew < newElements.length || iCur < currentElements.length) {
		const newElement = newElements[iNew];
		let currentElement = currentElements[iCur];

		if (!newElement) {
			do {
				currentElement.remove();
				currentElement = currentElements[++iCur];
			} while (currentElement);
			break;
		}

		if (!currentElement) {
			do {
				const { tagName = "meta", ...attributes } = newElement;
				iNew++;
				const el = document.createElement(tagName as string);
				setAttributes(el, attributes);
				document.head.insertBefore(el, endNode);
			} while (newElements[iNew]);
			break;
		}

		const { tagName = "meta", ...attributes } = newElement;

		if (tagName === currentElement.tagName.toLowerCase()) {
			setAttributes(currentElement, attributes, true);
			iNew++;
			iCur++;
			continue;
		}

		// Simple heuristic: We'll decide to insert or remove based on how
		// many elements are left on each side.
		if (newElements.length - iNew > currentElements.length - iCur) {
			// Insert
			const el = document.createElement(tagName as string);
			setAttributes(el, attributes);
			document.head.insertBefore(el, currentElement);
			iNew++;
		} else {
			// Remove
			currentElement.remove();
			iCur++;
		}
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

		if (attr === "textContent") {
			el.textContent = value as string;
			continue;
		}

		if (attr === "innerHTML") {
			el.innerHTML = value as string;
			continue;
		}

		if (attr === "children") {
			// Only noscript can have children
			// and if we're running, it's not noscript
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
