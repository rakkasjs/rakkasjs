import type {} from "./types";
import { getRequestContext } from "rakkasjs";
import type { CSSProperties } from "react";

let style: HTMLStyleElement | undefined;
let counter = 0;

export function css(styles: CSS): string {
	function cssWithPseudoClass(
		styles: CSS,
		pseudo: Pseudo[] = [],
		atRules: AtRule[] = [],
	): string {
		if (!style && typeof document !== "undefined") {
			style =
				(document.querySelector("style#rakkas-css") as HTMLStyleElement) ||
				document.createElement("style");
			style.id = "rakkas-css";
			document.head.appendChild(style);
		}

		const classes: string[] = [];

		for (const [key, value] of Object.entries(styles)) {
			if (key.includes("&")) {
				classes.push(
					cssWithPseudoClass(value, [...pseudo, key as Pseudo].sort(), atRules),
				);
			} else if (key.startsWith("@")) {
				classes.push(
					cssWithPseudoClass(value, pseudo, [...atRules, key as AtRule].sort()),
				);
			} else {
				const styleKey = [...pseudo, ...atRules].join(":") + `:${key}:${value}`;

				const ctx = getRequestContext();
				const names = ctx?.rakkas.css.names ?? rakkas.css;
				const prefix = ctx ? "s" : "c";

				let className = names.get(styleKey);
				if (!className) {
					const id = ctx ? ctx.rakkas.css.counter++ : counter++;
					className = `${prefix}${id.toString(36)}`;
					let selector = `.${className}`;
					for (const p of pseudo) {
						selector = p.replace(/&/g, selector);
					}

					let rule = `${selector}{${toKebabCase(key)}:${value}}`;

					for (const m of atRules) {
						rule = `${m}{${rule}}`;
					}

					style?.sheet!.insertRule(rule);
					ctx?.rakkas.css.rules.push(rule);
					names.set(styleKey, className);
					ctx?.rakkas.css.newNames.set(styleKey, className);
				}

				classes.push(className);
			}
		}

		return classes.join(" ");
	}

	return cssWithPseudoClass(styles);
}

function toKebabCase(str: string) {
	return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

type CSS = CSSProperties & { [key in Pseudo | AtRule]?: CSS };

type AtRule = `@${string}`;

type Pseudo = PseudoClass | `&${PseudoElement}`;

type PseudoClass =
	| `&${PseudoBase}`
	| `${PseudoBase} &`
	| `${PseudoBase}>&`
	| `&[${string}]`
	| `[${string}] &`
	| "&&"
	| "&&&"
	| "&&&&";

type PseudoBase =
	| ":-moz-broken"
	| ":-moz-drag-over"
	| ":-moz-first-node"
	| ":-moz-handler-blocked"
	| ":-moz-handler-crashed"
	| ":-moz-handler-disabled"
	| ":-moz-last-node"
	| ":-moz-loading"
	| ":-moz-locale-dir(ltr)"
	| ":-moz-locale-dir(rtl)"
	| ":-moz-only-whitespace"
	| ":-moz-submit-invalid"
	| ":-moz-suppressed"
	| ":-moz-user-disabled"
	| ":-moz-window-inactive"
	| ":active"
	| ":any-link"
	| ":autofill"
	| ":blank"
	| ":buffering"
	| ":checked"
	| ":current"
	| ":default"
	| ":defined"
	| ":dir(ltr)"
	| ":dir(rtl)"
	| ":disabled"
	| ":empty"
	| ":enabled"
	| ":first"
	| ":first-child"
	| ":first-of-type"
	| ":focus"
	| ":focus-visible"
	| ":focus-within"
	| ":fullscreen"
	| ":future"
	| `:has(${string})`
	| ":host"
	| `:host-context(${string})`
	| `:host(${string})`
	| ":hover"
	| ":in-range"
	| ":indeterminate"
	| ":invalid"
	| `:is(${string})`
	| `:lang(${string})`
	| ":last-child"
	| ":last-of-type"
	| ":left"
	| ":link"
	| ":local-link"
	| ":modal"
	| ":muted"
	| `:not(${string})`
	| `:nth-child(${string})`
	| `:nth-last-child(${string})`
	| `:nth-last-of-type(${string})`
	| `:nth-of-type(${string})`
	| ":only-child"
	| ":only-of-type"
	| ":optional"
	| ":out-of-range"
	| ":past"
	| ":paused"
	| ":picture-in-picture"
	| ":placeholder-shown"
	| ":playing"
	| ":popover-open"
	| ":read-only"
	| ":read-write"
	| ":required"
	| ":right"
	| ":root"
	| ":scope"
	| ":seeking"
	| ":stalled"
	| `:state(${string})`
	| ":target"
	| ":target-within"
	| ":user-invalid"
	| ":user-valid"
	| ":valid"
	| ":visited"
	| ":volume-locked"
	| `:where(${string})`;

type PseudoElement =
	| "::-moz-color-swatch"
	| "::-moz-focus-inner"
	| "::-moz-list-bullet"
	| "::-moz-list-number"
	| "::-moz-page"
	| "::-moz-page-sequence"
	| "::-moz-progress-bar"
	| "::-moz-range-progress"
	| "::-moz-range-thumb"
	| "::-moz-range-track"
	| "::-moz-scrolled-page-sequence"
	| "::-webkit-inner-spin-button"
	| "::-webkit-meter-bar"
	| "::-webkit-meter-even-less-good-value"
	| "::-webkit-meter-inner-element"
	| "::-webkit-meter-optimum-value"
	| "::-webkit-meter-suboptimum-value"
	| "::-webkit-progress-bar"
	| "::-webkit-progress-inner-element"
	| "::-webkit-progress-value"
	| "::-webkit-scrollbar"
	| "::-webkit-search-cancel-button"
	| "::-webkit-search-results-button"
	| "::-webkit-slider-runnable-track"
	| "::-webkit-slider-thumb"
	| "::after"
	| "::backdrop"
	| "::before"
	| "::cue"
	| "::cue-region"
	| "::file-selector-button"
	| "::first-letter"
	| "::first-line"
	| "::grammar-error"
	| `::highlight(${string})`
	| "::marker"
	| `::part(${string})`
	| "::placeholder"
	| "::selection"
	| `::slotted(${string})`
	| "::spelling-error"
	| "::target-text"
	| "::view-transition"
	| "::view-transition-group"
	| "::view-transition-image-pair"
	| "::view-transition-new"
	| "::view-transition-old";
