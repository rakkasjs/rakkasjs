// This is a trick to delay client-side hydration: Hydration won't happen until the Cypress test script calls document.rakkasHydrate() so we can reliably
// inspect the DOM before the hyration happens.
export function beforeStartClient(): Promise<void> {
	return new Promise<void>((resolve) => {
		(document as any).rakkasHydrate = resolve;
	});
}
