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
