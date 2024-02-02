/* eslint-disable @typescript-eslint/ban-types */
export function escapeJson(json: string): string {
	return json.replace(/</g, "\\u003c");
}

export function encodeFileNameSafe(s: string): string {
	return Array.from(new TextEncoder().encode(s))
		.map((x) =>
			(x < 48 || x > 57) && (x < 97 || x > 122)
				? "_" + x.toString(16).toUpperCase().padStart(2, "0")
				: String.fromCharCode(x),
		)
		.join("");
}

export function decodeFileNameSafe(s: string): string {
	return decodeURIComponent(s.replace(/_/g, "%"));
}

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}

export function escapeCss(text: string): string {
	return text.replace(/</g, "\\<");
}

export type HookDefinition<F extends Function> =
	| F
	| { order?: "pre" | "post"; handler: F };

export function sortHooks<T extends Function>(
	hooks: Array<false | null | undefined | HookDefinition<T>>,
): T[] {
	const filtered = hooks.filter(Boolean) as HookDefinition<T>[];
	return filtered
		.sort((a, b) => orderRank(a) - orderRank(b))
		.map((x) => (typeof x === "object" ? x.handler : x));
}

function orderRank(x: HookDefinition<Function>): number {
	const order = typeof x === "object" ? x.order : undefined;
	return order === "pre" ? -1 : order === "post" ? 1 : 0;
}
