export function escapeJson(json: string): string {
	return json.replace(/</g, "\\u003c");
}
