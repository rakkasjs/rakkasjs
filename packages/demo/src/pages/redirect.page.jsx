export function load({ url }) {
	return {
		status: 302,
		location: new URL("/about", url),
	};
}
