function detectLanguage(available: string[]): string {
	let fromCookie: string | undefined;

	if (RAKKAS_LOCALE_COOKIE_NAME) {
		const cookie = document.cookie;

		if (cookie) {
			const match = cookie.match(
				new RegExp(`(?:^|;)\\s*${RAKKAS_LOCALE_COOKIE_NAME}=([^;]+)`),
			);

			if (match !== null) {
				fromCookie = match[1];
			}
		}
	}

	const languages = navigator.languages || [navigator.language || "en"];

	return selectLocale(
		fromCookie ? [fromCookie, ...languages] : languages,
		available,
	);
}

function selectLocale(
	preferred: Readonly<string[]>,
	available: string[],
): string {
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
	return RAKKAS_DEFAULT_LOCALE;
}

const languages: Record<string, string> = {};
document.querySelectorAll("link").forEach((a) => {
	languages[a.hreflang] = a.href;
});

const redir = languages[detectLanguage(Object.keys(languages))];
location.href = redir;
