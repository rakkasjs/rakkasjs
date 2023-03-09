import path from "path";
import fs from "fs";
import deno from "@hattip/bundler-deno";
import { polyfillNodeForDeno } from "esbuild-plugin-polyfill-node";

export async function bundleForDeno(root: string) {
	const input = path.resolve(root, "dist/server/entry-deno.js");
	await fs.promises.writeFile(input, DENO_ENTRY);

	await generateStaticAssetManifest(root);

	deno(
		{
			input,
			output: path.resolve(root, "dist/deno/mod.js"),
			staticDir: "dist/client",
		},
		(options) => {
			options.define = options.define || {};
			options.define["process.env.NODE_ENV"] = '"production"';
			options.define["process.env.RAKKAS_PRERENDER"] = "undefined";

			options.plugins = options.plugins || [];

			options.plugins.push({
				name: "html-tokenize",
				setup(build) {
					// const seen = new Set<string>();
					// build.onResolve({ filter: /.*/ }, (args) => {
					// 	if (!args.path.startsWith(".") && !seen.has(args.path)) {
					// 		console.log(args.path, "from", args.importer);
					// 		seen.add(args.path);
					// 	}
					//
					// 	return undefined;
					// });

					build.onResolve(
						{ filter: /^(html-tokenize|multipipe)(\/.*)?$/ },
						(args) => {
							return {
								path: args.path,
								namespace: "html-tokenize",
							};
						},
					);

					build.onLoad({ filter: /.*/, namespace: "html-tokenize" }, () => {
						return {
							contents: "",
							loader: "js",
						};
					});
				},
			});

			// options.plugins.push(
			// 	polyfillNodeForDeno({ polyfills: { stream: "empty" } }),
			// );

			options.logLevel = "info";
		},
	).catch(() => {
		process.exit(1);
	});
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

const STD_VERSION = "0.160.0";

const DENO_ENTRY = `
	import * as path from "https://deno.land/std@${STD_VERSION}/path/mod.ts";
	import { serve } from "https://deno.land/std@${STD_VERSION}/http/server.ts";
	import { serveDir } from "https://deno.land/std@${STD_VERSION}/http/file_server.ts";
	import { createRequestHandler } from "@hattip/adapter-deno";
	import handler from "./hattip.js";
	import staticFiles from "./static-manifest.js";

	const staticDir = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "public");

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
