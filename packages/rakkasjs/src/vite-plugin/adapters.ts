import path from "path";
import fs from "fs";
import cloudflareWorkers from "@hattip/bundler-cloudflare-workers";
import { bundle as netlify } from "@hattip/bundler-netlify";
import { bundle as vercel } from "@hattip/bundler-vercel";
import deno from "@hattip/bundler-deno";

export interface RakkasAdapter {
	name: string;
	bundle?(root: string): Promise<void>;
	disableStreaming?: boolean;
}

export const adapters: Record<string, RakkasAdapter> = {
	node: {
		name: "node",
	},

	"cloudflare-workers": {
		name: "cloudflare-workers",
		async bundle(root: string) {
			let entry = findEntry(root, "src/entry-cloudflare-workers");

			if (!entry) {
				entry = path.resolve(root, "dist/server/entry-cloudflare-workers.js");
				await fs.promises.writeFile(entry, CLOUDFLARE_WORKERS_ENTRY);
			}

			cloudflareWorkers(
				{
					output: path.resolve(
						root,
						"dist/server/cloudflare-workers-bundle.js",
					),
					cfwEntry: entry,
				},
				(options) => {
					options.define = options.define || {};
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			);
		},
	},

	vercel: {
		name: "vercel",

		disableStreaming: true,

		async bundle(root) {
			let entry = findEntry(root, "src/entry-vercel");

			if (!entry) {
				entry = path.resolve(root, "dist/server/entry-vercel.js");
				await fs.promises.writeFile(entry, VERCEL_ENTRY);
			}

			vercel({
				serverlessEntry: entry,
				staticDir: path.resolve(root, "dist/client"),
				manipulateEsbuildOptions(options) {
					options.define = options.define || {};
					options.define["process.env.NODE_ENV"] = '"production"';
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			});
		},
	},

	"vercel-edge": {
		name: "vercel-edge",

		async bundle(root) {
			let entry = findEntry(root, "src/entry-vercel-edge");

			if (!entry) {
				entry = path.resolve(root, "dist/server/entry-vercel-edge.js");
				await fs.promises.writeFile(entry, VERCEL_EDGE_ENTRY);
			}

			vercel({
				edgeEntry: entry,
				staticDir: path.resolve(root, "dist/client"),
				manipulateEsbuildOptions(options) {
					options.define = options.define || {};
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			});
		},
	},

	netlify: {
		name: "netlify",

		disableStreaming: true,

		async bundle(root) {
			let entry = findEntry(root, "src/entry-netlify");

			if (!entry) {
				entry = path.resolve(root, "dist/server/entry-netlify.js");
				await fs.promises.writeFile(entry, NETLIFY_ENTRY);
			}

			netlify({
				functionEntry: entry,
				staticDir: path.resolve(root, "dist/client"),
				manipulateEsbuildOptions(options) {
					options.define = options.define || {};
					options.define["process.env.NODE_ENV"] = '"production"';
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			});
		},
	},

	"netlify-edge": {
		name: "netlify-edge",

		async bundle(root) {
			let entry = findEntry(root, "src/entry-netlify-edge");

			if (!entry) {
				entry = path.resolve(root, "dist/server/entry-netlify-edge.js");
				await fs.promises.writeFile(entry, NETLIFY_EDGE_ENTRY);
			}

			await generateStaticAssetManifest(root);

			netlify({
				edgeEntry: entry,
				staticDir: path.resolve(root, "dist/client"),
				manipulateEsbuildOptions(options) {
					options.define = options.define || {};
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			});
		},
	},

	deno: {
		name: "deno",

		async bundle(root) {
			let input = findEntry(root, "src/entry-deno");

			if (!input) {
				input = path.resolve(root, "dist/server/entry-deno.js");
				await fs.promises.writeFile(input, DENO_ENTRY);
			}

			await generateStaticAssetManifest(root);

			((deno as any).default as typeof deno)(
				{
					input,
					output: path.resolve(root, "dist/deno/mod.js"),
					staticDir: "dist/client",
				},
				(options) => {
					options.define = options.define || {};
					options.define["process.env.NODE_ENV"] = '"production"';
					options.define["process.env.RAKKAS_PRERENDER"] = "undefined";
				},
			);
		},
	},
};

function findEntry(root: string, name: string) {
	const entries = [
		path.resolve(root, name) + ".ts",
		path.resolve(root, name) + ".js",
		path.resolve(root, name) + ".tsx",
		path.resolve(root, name) + ".jsx",
	];

	return entries.find((entry) => fs.existsSync(entry));
}

async function generateStaticAssetManifest(root: string) {
	const files = walk(path.resolve(root, "dist/client"));
	await fs.promises.writeFile(
		path.resolve(root, "dist/server/static-manifest.js"),
		`export default new Set(${JSON.stringify([...files])})`,
	);
}

function walk(
	dir: string,
	root = dir,
	entries = new Set<string>(),
): Set<string> {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const filepath = path.join(dir, file);
		const stat = fs.statSync(filepath);
		if (stat.isDirectory()) {
			walk(filepath, root, entries);
		} else {
			entries.add("/" + path.relative(root, filepath).replace(/\\/g, "/"));
		}
	}

	return entries;
}

const CLOUDFLARE_WORKERS_ENTRY = `
	import hattipHandler from "./hattip.js";
	import cloudflareWorkersAdapter from "@hattip/adapter-cloudflare-workers";

	const handler = cloudflareWorkersAdapter(hattipHandler);

	export default {
		fetch(req, env, ctx) {
			globalThis.process = { env: {} };
			for (const [key, value] of Object.entries(env)) {
				if (typeof value === "string") process.env[key] = value;
			}
			return handler(req, env, ctx);
		}
	};
`;

const NETLIFY_ENTRY = `
	import adapter from "@hattip/adapter-netlify-functions";
	import hattipHandler from "./hattip.js";

	export const handler = adapter(hattipHandler);
`;

const NETLIFY_EDGE_ENTRY = `
	globalThis.process = { env: Deno.env.toObject() };

	import adapter from "@hattip/adapter-netlify-edge";
	import handler from "./hattip.js";
	import staticFiles from "./static-manifest.js";

	export default adapter((ctx) => {
		const path = new URL(ctx.request.url).pathname;
		if (staticFiles.has(path) || staticFiles.has(path + "/index.html")) {
			ctx.passThrough();
			return new Response("Ugly", { status: 404 });
		}

		return handler(ctx);
	});
`;

const VERCEL_ENTRY = `
	import { createMiddleware } from "rakkasjs/node-adapter";
	import handler from "./hattip.js";

	export default createMiddleware(handler, { origin: "", trustProxy: true });
`;

const VERCEL_EDGE_ENTRY = `
	import { ReadableStream } from 'web-streams-polyfill/ponyfill';
	Object.assign(globalThis, { ReadableStream });

	import adapter from "@hattip/adapter-vercel-edge";
	import handler from "./hattip.js";

	export default adapter(handler);
`;

const DENO_ENTRY = `
	globalThis.process = { env: Deno.env.toObject() };

	import * as path from "https://deno.land/std@0.144.0/path/mod.ts";
	import { serve, serveDir, createRequestHandler } from "@hattip/adapter-deno";
	import handler from "./hattip.js";
	import staticFiles from "./static-manifest.js";

	const staticDir = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "static");

	const denoHandler = createRequestHandler(handler);

	serve(
		async (request, connInfo) => {
			const url = new URL(request.url);
			const path = url.pathname;
			if (staticFiles.has(path)) {
				return serveDir(request, { fsRoot: staticDir });
			} else if (staticFiles.has(path + "/index.html")) {
				url.pathname = path + "/index.html";
				return serveDir(new Request(url, request), { fsRoot: staticDir });
			}

			return denoHandler(request, connInfo);
		},
		{
			port: Number(process.env.PORT) || 3000,
		},
	);
`;
