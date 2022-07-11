import path from "path";
import fs from "fs";
import cloudflareWorkers from "@hattip/bundler-cloudflare-workers";
// import deno from "@hattip/bundler-deno";
// import netlify from "@hattip/bundler-netlify";
// import vercel from "@hattip/bundler-vercel";

export interface RakkasAdapter {
	name: string;
	bundle?(root: string): Promise<void>;
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
				await fs.promises.writeFile(
					entry,
					CLOUDFLARE_WORKERS_DEFAULT_ENTRY_CONTENTS,
				);
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
	},
	"vercel-edge": {
		name: "vercel-edge",
	},
	netlify: {
		name: "netlify",
	},
	"netlify-edge": {
		name: "netlify-edge",
	},
	deno: {
		name: "deno",
	},
};

const CLOUDFLARE_WORKERS_DEFAULT_ENTRY_CONTENTS = `
	import hattipHandler from "./hattip.js";
	import cloudflareWorkersAdapter from "@hattip/adapter-cloudflare-workers";

	const handler = cloudflareWorkersAdapter(hattipHandler);

	export default {
		fetch(req, env, ctx) {
			globalThis.process = { env: {} };
			for (const [key, value] of Object.entries(env)) {
				if (typeof value === "string") process.env[key] = value;
			}
			console.log(process.env)
			return handler(req, env, ctx);
		}
	};
`;

function findEntry(root: string, name: string) {
	const entries = [
		path.resolve(root, name) + ".ts",
		path.resolve(root, name) + ".js",
		path.resolve(root, name) + ".tsx",
		path.resolve(root, name) + ".jsx",
	];

	return entries.find((entry) => fs.existsSync(entry));
}
