export * from "./dist";

declare global {
	const RAKKAS_BUILD_TARGET:
		| "node"
		| "static"
		| "vercel"
		| "netlify"
		| "cloudflare-workers";
}
