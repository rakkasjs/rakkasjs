export function selectLocale(
	preferred: Readonly<string[]>,
	available: string[],
): string {
	if (!RAKKAS_DETECT_LOCALE || !available.length) return RAKKAS_DEFAULT_LOCALE;

	for (const locale of preferred) {
		// First look for an exact match (wants en-US, we have en-US)
		if (available.includes(locale)) return locale;

		// Look for a loose match (wants en-US we have en or vice-versa)
		const [lang] = locale.split("-");

		const found = available.find((x) => x.startsWith(lang));
		if (found) return found;
	}

	// Look for a small mismatch (wants en-US but we have en-GB)
	for (const locale of preferred) {
		const [lang] = locale.split("-");

		const found = available.find((x) => x.split("-")[0] === lang);
		if (found) return found;
	}

	// Return default
	return available[0];
}
