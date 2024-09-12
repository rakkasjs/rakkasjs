import type { RequestContext } from "rakkasjs";
import { accept } from "@hattip/headers";
import { createHash } from "node:crypto";
import type { Sharp as SharpType } from "sharp";
import fs from "node:fs";
import { createCache, FsCache } from "./cache";

export interface CreateHandlerOptions {
	dev: boolean;
	allowAvif: boolean;
	externalUrlPatterns: RegExp[];
	cacheControl: string;
	externalCacheControl: string;
}

export type Format = "webp" | "avif" | "jpeg" | "png";

const cacheDir = "dist/image-cache";

export function createHandler({
	dev,
	allowAvif,
	externalUrlPatterns,
	cacheControl,
	externalCacheControl,
}: CreateHandlerOptions) {
	const accepted: Record<string, Format> = {
		"image/avif": "avif",
		"image/webp": "webp",
	};

	if (!allowAvif) {
		delete accepted["image/avif"];
	}

	let cacheDirsCreated: Promise<any> | boolean = dev;

	const externalCache = createCache(
		new FsCache<Buffer>(
			cacheDir + "/external",
			(data) => data,
			(data) => data,
		),
	);

	const transformCache = createCache(
		new FsCache<TransformResult>(
			cacheDir + "/transform",
			serializeTransformResult,
			deserializeTransformResult,
		),
	);

	return async function imageHandler(
		ctx: RequestContext<{
			image: string;
			width: string;
			quality: string;
		}>,
	): Promise<Response> {
		if (!cacheDirsCreated) {
			cacheDirsCreated = Promise.all([
				fs.promises.mkdir(cacheDir + "/external", { recursive: true }),
				fs.promises.mkdir(cacheDir + "/transform", { recursive: true }),
			]);
		}

		if (cacheDirsCreated instanceof Promise) {
			await cacheDirsCreated;
			cacheDirsCreated = true;
		}

		let image = ctx.params.image;
		const width = Number(ctx.params.width);
		const quality = Number(ctx.params.quality);

		const isExternal = image.match(/^(?:https?:\/\/)|(?:data:)/);

		if (!isExternal && !dev && image.match(/[/\\]/)) {
			return new Response("Invalid image path", { status: 400 });
		}

		if (
			isExternal &&
			!externalUrlPatterns.some((pattern) => pattern.test(image))
		) {
			return new Response("Forbidden external image", { status: 403 });
		}

		if (isExternal) {
			try {
				new URL(image);
			} catch {
				return new Response("Invalid image URL", { status: 400 });
			}
		}

		if (!Number.isInteger(width) || width < 1 || width > 8192) {
			return new Response("Invalid width", { status: 400 });
		}

		if (!Number.isInteger(quality) || quality < 0 || quality > 100) {
			return new Response("Invalid quality", { status: 400 });
		}

		let extension = image.match(/\.(jpe?g|png|webp|avif)$/)?.[0] ?? ".jpeg";
		if (extension === ".jpeg") extension = ".jpg";
		const originalType: "jpeg" | "png" | "webp" | "avif" = extension.slice(
			1,
		) as any;

		const requestedType: typeof originalType = accept(
			ctx.request.headers.get("accept"),
			{
				...accepted,
				"*":
					originalType === "avif" || originalType === "webp"
						? "jpeg"
						: originalType,
			},
		);

		async function fetchExternalImage(): Promise<Buffer> {
			const response = await fetch(image).catch(() => undefined);
			if (!response || !response.ok) {
				throw new Response(
					response
						? `Failed to fetch external "${image}" (status ${response.status})`
						: `Failed to fetch external "${image}"`,
					{ status: 500 },
				);
			}

			return Buffer.from(await response.arrayBuffer());
		}

		async function transform(): Promise<TransformResult> {
			const { default: Sharp } = await import("sharp");
			let sharp: SharpType;

			if (isExternal) {
				const result = await (dev
					? fetchExternalImage()
					: externalCache(
							image,
							fetchExternalImage,
							(data) => data !== undefined,
						));

				sharp = Sharp(result);
			} else {
				if (dev) {
					image = image.replace(/[?#].*$/, "");
					if (image.startsWith("/@fs/")) {
						image = image.slice("/@fs".length);
					} else {
						image = "." + image;
					}
				}
				sharp = Sharp(dev ? image : `./dist/client/_app/assets/${image}`);
			}

			const buffer = await sharp
				.resize(width)
				.toFormat(requestedType, {
					quality: quality === 0 ? undefined : quality,
				})
				.toBuffer();

			const hash = createHash("sha1")
				.update(buffer)
				.digest("base64")
				.substring(0, 27);

			return { type: requestedType, hash, buffer };
		}

		const { type, hash, buffer } = await (dev
			? transform()
			: transformCache(
					`${requestedType}-${width}-${quality}-${image}`,
					transform,
					(data) => data !== undefined,
				));

		const etag = `W/"${hash}"`;

		if (ctx.request.headers.get("if-none-match") === etag) {
			return new Response(null, { status: 304 });
		}

		const headers: Record<string, string> = {
			Vary: "Accept",
			"Content-Type": `image/${type}`,
			"Content-Length": buffer.byteLength.toString(),
			etag,
		};

		if (!dev) {
			headers["Cache-Control"] = isExternal
				? externalCacheControl
				: cacheControl;
		}

		return new Response(ctx.method === "HEAD" ? null : buffer, { headers });
	};
}

interface TransformResult {
	type: Format;
	hash: string;
	buffer: Buffer;
}

function serializeTransformResult(result: TransformResult): Buffer {
	const header = Buffer.from(
		JSON.stringify({
			type: result.type,
			hash: result.hash,
		}) + "\0",
		"utf8",
	);
	return Buffer.concat([header, result.buffer]);
}

function deserializeTransformResult(buffer: Buffer): TransformResult {
	const headerEnd = buffer.indexOf(0);
	const header = JSON.parse(buffer.subarray(0, headerEnd).toString("utf8"));
	const body = buffer.subarray(headerEnd + 1);
	return { ...header, buffer: body };
}
