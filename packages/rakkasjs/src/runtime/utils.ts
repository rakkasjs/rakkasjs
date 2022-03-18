export function escapeJson(json: any): string {
	return JSON.stringify(json).replace(/</g, "\\u003c");
}
