export function stableJson(data: any): string {
	return JSON.stringify(data, (k, v) => {
		if (typeof v === "object" && v && !Array.isArray(v)) {
			// Sort keys
			return Object.fromEntries(
				Object.entries(v).sort((a, b) => a[0].localeCompare(b[0], "en")),
			);
		}

		return v;
	});
}
