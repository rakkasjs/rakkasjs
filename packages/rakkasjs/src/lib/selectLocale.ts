export const availableLocales = RAKKAS_LOCALES;

export function selectLocale(preferred: Readonly<string[]>): string {
	if (!availableLocales) return "en";

	for (const locale of preferred) {
		// First look for an exact match (wants en-US, we have en-US)
		if (availableLocales.includes(locale)) return locale;

		// If it's not fully specified, look for a language match (wants en, we have en-US)
		if (!locale.includes("-")) {
			const found = availableLocales.find((x) => x.startsWith(locale));
			if (found) return found;
		}
	}

	// Look for a broad language match (wants en-US but we have en)
	for (const locale of preferred) {
		const [lang] = locale.split("-");

		const found = availableLocales.find((x) => x.startsWith(lang));
		if (found) return found;
	}

	// Look for a small mismatch (wants en-US but we have en-GB)
	for (const locale of preferred) {
		const [lang] = locale.split("-");

		const found = availableLocales.find((x) => x.split("-")[0] === lang);
		if (found) return found;
	}

	// Return default
	return availableLocales[0];
}
