import { defineConfig } from "@rakkasjs/cli";

// Edit this file to change default configuration options.
// You may delete it if you're happy with the default config options.

// Rakkas bundles this file with esbuild before loading, so you can TypeScript.

// defineConfig is a helper to ensure IDE code-completion.

export default defineConfig({
	prerender: ["/locales"],
	locales: {
		default: "en",
		detect: true,
		cookieName: "LOCALE",
	},
});
