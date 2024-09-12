import type { Plugin, ResolvedConfig } from "vite";
import type {} from "rakkasjs/vite-plugin";
import fs from "node:fs";
import { uneval } from "devalue";
import Sharp from "sharp";
import { urlPrefixToRegExp } from "./prefix-to-regexp";
import type { CreateHandlerOptions } from "./handler";

export interface RakkasImageOptions {
	/**
	 * Whether to allow AVIF format. The AVIF format usually provides better compression and quality but
	 * it might be slower to encode.
	 *
	 * @default true
	 */
	allowAvif?: boolean;
	/**
	 * Cache-Control header value for imported images (only in production).
	 * @default "public, max-age=31536000, immutable"
	 */
	cacheControl?: string;
	/**
	 * Cache-Control header value for external images (only in production).
	 * @default cacheControl
	 */
	externalCacheControl?: string;
	/**
	 * Allowed extern URL patterns.
	 *
	 * URL patterns must consist of a protocol, a domain name, and an optional path and are interpreted as prefixes.
	 *
	 * - The protocol must be `http`, `https`, or `*` (wildcard), followed by `://`.
	 * - The domain name may start with `*.` to match a single subdomain or `**.` to match any subdomain. Other `*`
	 * characters are not allowed.
	 * - The path, if present, should start with `/`. It should usually end with `/`. Wildcards are not allowed in the
	 *
	 * Examples:
	 * - `http://example.com` matches `http://example.com`, `http://example.com/`, `http://example.com/test`, etc.
	 * - `https://example.com` matches `https://example.com`, `https://example.com/`, `https://example.com/test`, etc.
	 * - `*://example.com` matches `http://example.com`, `http://example.com/`, `http://example.com/test`,
	 * `https://example.com`, `https://example.com/`, `https://example.com/test`, etc.
	 * - `http://*.example.com` matches `http://foo.example.com`, `http://bar.example.com`, but not
	 * `http://example.com` or `http://foo.bar.example.com`.
	 * - `http://**.example.com` matches `http://foo.example.com`, `http://foo.bar.example.com`, but not
	 * `http://example.com`.
	 * - `http://example.com/test-` matches `http://example.com/test-pic.jpg`, but not `http://example.com/test-dir/`.
	 *
	 * @default []
	 */
	externalUrlPatterns?: string[];
	/**
	 * Whether to disable the optimization endpoint.
	 *
	 * @default false
	 */
	disableOptimizationEndpoint?: boolean;
}

export function rakkasImage(options: RakkasImageOptions = {}): Plugin {
	const {
		allowAvif = true,
		externalUrlPatterns = [],
		cacheControl = "public, max-age=31536000, immutable",
		externalCacheControl = cacheControl,
		disableOptimizationEndpoint = false,
	} = options;

	const externalUrlRegexes = externalUrlPatterns.map(urlPrefixToRegExp);

	let isDev: boolean;
	let assetsInlineLimit: ResolvedConfig["build"]["assetsInlineLimit"];

	return {
		name: "@rakkasjs/image",
		api: {
			rakkas: disableOptimizationEndpoint
				? undefined
				: {
						getRoutes() {
							return [
								{
									type: "api",
									path: "/_app/image/[width]/[quality]/[image]",
									handler: "rakkasjs:image-handler",
								},
							];
						},
					},
		},
		configResolved(config) {
			isDev = config.command === "serve";
			assetsInlineLimit = config.build.assetsInlineLimit;
		},
		config() {
			return {
				ssr: {
					external: ["@rakkasjs/image"],
				},
			};
		},
		resolveId(id) {
			if (id === "rakkasjs:image-handler") {
				return "\0virtual:rakkasjs:image-handler";
			}
		},
		load(id) {
			if (id === "\0virtual:rakkasjs:image-handler") {
				return createHandlerModule({
					dev: isDev,
					allowAvif,
					externalUrlPatterns: externalUrlRegexes,
					cacheControl,
					externalCacheControl,
				});
			}
		},
		async transform(code, id) {
			let cleanId = id.replace(/[?#].*$/, "");
			if (!cleanId.match(imageFiles)) return;

			if (cleanId.startsWith("/@fs/")) {
				cleanId = cleanId.slice("/@fs".length);
			}

			const imageContent = fs.readFileSync(cleanId);
			const sharp = Sharp(imageContent);
			const { width, height } = await sharp.metadata();

			if (width === undefined || height === undefined) {
				return null;
			}

			let output =
				`${code};\n` +
				`export const width = ${width};\n` +
				`export const height = ${height};\n`;

			if (!isDev) {
				let realLimit =
					GIT_LFS_PREFIX.compare(imageContent, 0, GIT_LFS_PREFIX.length) === 0
						? false
						: typeof assetsInlineLimit === "number"
							? assetsInlineLimit
							: (assetsInlineLimit(cleanId, imageContent) ?? 4096);

				if (realLimit === false) {
					realLimit = -Infinity;
				} else if (realLimit === true) {
					realLimit = Infinity;
				}

				if (imageContent.byteLength > realLimit) {
					const placeholder = await createBlurData(sharp);
					if (placeholder) {
						output += `export const blurData = ${JSON.stringify(placeholder)};\n`;
					}
				}
			}

			return { code: output };
		},
	};
}

const imageFiles = /\.(?:png|jpg|jpeg|webp|avif)$/;

const GIT_LFS_PREFIX = Buffer.from("version https://git-lfs.github.com");

function createHandlerModule(options: CreateHandlerOptions) {
	return `
		import { createHandler } from "@rakkasjs/image/handler";

		const handler = createHandler(${uneval(options)});

		export {
			handler as get,
			handler as head,
		};
	`;
}

async function createBlurData(sharp: Sharp.Sharp) {
	const { width, height, pages } = await sharp.metadata();

	if ((pages && pages > 1) || width === undefined || height === undefined) {
		return null;
	}

	const placeholderWidth = width > height ? 16 : (width / height) * 16;
	const resized = await sharp
		.resize(placeholderWidth, 25)
		.toFormat("webp")
		.toBuffer();

	return resized.toString("base64");
}
