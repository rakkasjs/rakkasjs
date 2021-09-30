export function beforeStartClient(): void | Promise<void> {
	const url = new URL(window.location.href);

	if (url.searchParams.has("waitBeforeHydrating")) {
		return new Promise((resolve) => (document.rakkasHydrate = resolve));
	}
}
