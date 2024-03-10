/**
 * Marked as deprecated to prevent accidental use.
 *
 * @deprecated
 */
export function createRequestHandler() {
	return () => {
		throw new Error("Request handler called from client-side");
	};
}
