import { defineConfig } from "@rakkasjs/cli";

// Edit this file to change default configuration options.
// You may delete it if you're happy with the default config options.

// Rakkas bundles this file with esbuild before loading, so you can TypeScript.

// defineConfig is a helper to ensure IDE code-completion.
export default defineConfig({
	//
	// File extensions for pages and layouts
	// pageExtensions: ["jsx", "tsx"],
	//
	// Directory that contains pages and layouts
	// pagesDir: "pages",
	//
	// File extensions for endpoints and middleware
	// endpointExtensions: ["js", "ts"],
	//
	// Directory that contains endpoints and middleware
	// apiDir: "api",
	//
	// Base URL for endpoints
	// apiRoot: "/api",
	//
	// Trust the x-forwarded-host and x-forwarded-proto headers in dev server.
	// This is useful behind a reverse proxy. Set env variable TRUST_FORWARDED_ORIGIN to
	// a non-empty string if you want the same in production.
	// trustForwardedOrigin: false,
	//
	// Vite configuration (not all options are supported)
	// vite: {},
});
