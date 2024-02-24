import type {} from "./types";
import type { ServerHooks } from "rakkasjs/server";

export default function cssHooks(): ServerHooks {
	return {
		createPageHooks(ctx) {
			ctx.rakkas.css = {
				names: new Map(),
				newNames: new Map(),
				rules: [],
				counter: 0,
			};
			return {
				emitServerOnlyHeadElements() {
					const textContent = ctx.rakkas.css.rules.join("\n");
					ctx.rakkas.css.rules.length = 0;

					return [
						{
							tagName: "style",
							id: "rakkas-css",
							textContent,
						},
					];
				},

				emitToSyncHeadScript() {
					return (
						`rakkas.css=new Map(${JSON.stringify([...ctx.rakkas.css.names])});` +
						`rakkas.moveCss=${moveCss.toString()};`
					);
				},

				emitBeforeSsrChunk() {
					if (ctx.rakkas.css.rules.length > 0) {
						const style = `<style data-rakkas-css>${ctx.rakkas.css.rules.join("\n")}</style>`;
						const newNames = [...ctx.rakkas.css.names];
						ctx.rakkas.css.names.clear();
						ctx.rakkas.css.rules.length = 0;

						return (
							style +
							`<script>${JSON.stringify(newNames)}.map(([k,v])=>rakkas.css.set(k,v));rakkas.moveCss(document.currentScript)</script>`
						);
					}
				},
			};
		},
	};
}

function moveCss(script: HTMLScriptElement) {
	const style = script.previousElementSibling as HTMLStyleElement;
	document.head.appendChild(style);
	script.remove();
}
