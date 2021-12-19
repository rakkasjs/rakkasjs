export * from "./dist";

declare global {
	const RAKKAS_BUILD_TARGET:
		| "node"
		| "static"
		| "vercel"
		| "netlify"
		| "cloudflare-workers";

	const RAKKAS_BUILD_ID: string;

	const RAKKAS_DEFAULT_LOCALE: string;
	const RAKKAS_DETECT_LOCALE: boolean;
	const RAKKAS_LOCALE_COOKIE_NAME: string | undefined;
}
