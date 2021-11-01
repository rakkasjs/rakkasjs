import { createCommand, Option } from "commander";
import { build as viteBuild } from "vite";
import { loadConfig } from "../lib/config";
import { makeViteConfig } from "../lib/vite-config";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import micromatch from "micromatch";
import chalk from "chalk";
import { BuildTarget, FullConfig } from "../..";
import getPort from "get-port";
import { spawn } from "child_process";
import fetch, { FetchError, Response } from "node-fetch";
import rimraf from "rimraf";
import { build as esbuild } from "esbuild";

const TARGETS: BuildTarget[] = [
	"node",
	"static",
	"vercel",
	"netlify",
	"cloudflare-workers",
];

interface BuildCommandOptions {
	target?: BuildTarget;
}

export default function buildCommand() {
	const cmd = createCommand("build")
		.description("Build for production")
		.addOption(
			new Option("-t, --target <target>", "Override build target").choices(
				TARGETS,
			),
		)
		.action(async (options: BuildCommandOptions) => {
			const { config } = await loadConfig(undefined, options);

			// eslint-disable-next-line no-console
			console.log(
				chalk.whiteBright("Building for target"),
				chalk.yellowBright(config.target),
			);

			const result = await build(config);

			return result;
		});

	return cmd;
}

export async function build(config: FullConfig) {
	let outDir: string;
	let clientOutDir: string;
	let serverOutDir: string;
	let entry: string;

	switch (config.target) {
		case "node":
			outDir = path.resolve("dist");
			clientOutDir = path.join(outDir, "client");
			serverOutDir = path.join(outDir, "server");
			entry = path.resolve(__dirname, "./entries/entry-node.js");
			break;

		case "static":
			outDir = path.resolve("node_modules/.rakkas/static");
			clientOutDir = path.join(outDir, "client");
			serverOutDir = path.join(outDir, "server");
			entry = path.resolve(__dirname, "./entries/entry-node.js");
			break;

		case "vercel":
			outDir = path.resolve(".vercel_build_output");
			clientOutDir = path.join(outDir, "static");
			serverOutDir = path.resolve("./node_modules/.rakkas/vercel");
			entry = path.resolve(__dirname, "./entries/entry-vercel.js");

			await fs.promises.mkdir(path.join(outDir, "config"), {
				recursive: true,
			});

			await fs.promises.writeFile(
				path.join(outDir, "config", "routes.json"),
				JSON.stringify([
					{ handle: "filesystem" },
					{
						src: "/(.*)",
						dest: "/.vercel/functions/render",
					},
				]),
			);
			break;

		case "netlify":
			outDir = path.resolve("netlify");
			clientOutDir = path.join(outDir, "static");
			serverOutDir = path.resolve("./node_modules/.rakkas/netlify");
			entry = path.resolve(__dirname, "./entries/entry-netlify.js");
			break;

		case "cloudflare-workers":
			outDir = path.resolve("cloudflare");
			clientOutDir = path.join(outDir, "static");
			serverOutDir = path.resolve("./node_modules/.rakkas/cloudflare");
			entry = path.resolve(__dirname, "./entries/entry-cloudflare-workers.js");
			break;

		default:
			throw new Error(`Build target ${config.target} is not supported yet`);
	}

	await fs.promises.mkdir(clientOutDir, { recursive: true });
	await fs.promises.mkdir(serverOutDir, { recursive: true });

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building client"));

	const clientConfig = await makeViteConfig(config, { ssr: false });

	await viteBuild({
		...clientConfig,

		build: {
			outDir: clientOutDir,
			emptyOutDir: true,
			ssrManifest: true,
			target: "es2020",
		},
	});

	const ssrConfig = await makeViteConfig(config, {
		ssr: true,
		// noExternal: config.target === "cloudflare-workers",
	});

	// Fix index.html
	const htmlTemplate = await fs.promises.readFile(
		path.join(clientOutDir, "index.html"),
	);

	const dom = cheerio.load(htmlTemplate);

	const html = dom("html").first();
	Object.keys(html.attr()).forEach((a) => html.removeAttr(a));
	html.prepend("<!-- rakkas-html-attributes-placeholder -->");

	const body = html.find("body").first();
	Object.keys(body.attr()).forEach((a) => body.removeAttr(a));
	body.prepend("<!-- rakkas-body-attributes-placeholder -->");

	await fs.promises.unlink(path.join(clientOutDir, "index.html"));

	// Fix manifest
	const rawManifest = JSON.parse(
		await fs.promises.readFile(
			path.join(clientOutDir, "ssr-manifest.json"),
			"utf-8",
		),
	) as Record<string, string[]>;

	const importManifest = JSON.parse(
		await fs.promises.readFile(
			path.join(clientOutDir, "import-manifest.json"),
			"utf-8",
		),
	) as Record<string, string[]>;

	const pagesDir = path.resolve(`./src/${config.pagesDir}`);
	const pageExtensions = config.pageExtensions.join("|");

	const pageMatcher = micromatch.matcher(`**/(*.)?page.(${pageExtensions})`);
	const layoutMatcher = micromatch.matcher(
		`**/(*/)?layout.(${pageExtensions})`,
	);

	const manifest = Object.fromEntries(
		Object.entries(rawManifest)
			.map(([name, value]) => {
				const relative = path.relative(pagesDir, path.resolve("src", name));
				if (
					relative &&
					!relative.startsWith("..") &&
					!path.isAbsolute(relative) &&
					(pageMatcher(relative) || layoutMatcher(relative))
				) {
					const fullName = path.join(config.pagesDir, relative);
					const assetSet = new Set<string>(value);
					const deps = importManifest[fullName] || [];
					for (const dep of deps) {
						const assets = rawManifest[dep];
						if (!assets) continue;
						assets.forEach((x) => assetSet.add(x));
					}

					return [path.join("/", config.pagesDir, relative), [...assetSet]];
				}
			})
			.filter(Boolean) as Array<[string, string[]]>,
	);

	await fs.promises.unlink(path.join(clientOutDir, "ssr-manifest.json"));
	await fs.promises.unlink(path.join(clientOutDir, "import-manifest.json"));

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building server"));

	await viteBuild({
		...ssrConfig,

		build: {
			ssr: true,
			target: "node12",
			outDir: serverOutDir,
			rollupOptions: {
				input: [
					"@rakkasjs/page-routes",
					"@rakkasjs/api-routes",
					"rakkasjs/server",
				],
			},
			emptyOutDir: true,
		},

		publicDir: false,
	});

	await fs.promises.writeFile(
		path.join(serverOutDir, "rakkas-manifest.json"),
		JSON.stringify(manifest),
		"utf8",
	);

	await fs.promises.writeFile(
		path.join(serverOutDir, "html-template.js"),
		`module.exports = ${JSON.stringify(dom.html())}`,
		"utf8",
	);

	await fs.promises.copyFile(entry, path.join(serverOutDir, "index.js"));

	if (config.target === "vercel") {
		// eslint-disable-next-line no-console
		console.log(chalk.gray("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions/node/render"), {
			recursive: true,
		});

		await esbuild({
			bundle: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "functions/node/render/index.js"),
			platform: "node",
			target: "node12",
			format: "cjs",
		});
	} else if (config.target === "netlify") {
		// eslint-disable-next-line no-console
		console.log(chalk.gray("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions"), {
			recursive: true,
		});

		await esbuild({
			bundle: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "functions/render.js"),
			platform: "node",
			target: "node12",
			format: "cjs",
		});

		await fs.promises.writeFile(
			path.join(clientOutDir, "_redirects"),
			"/*  /.netlify/functions/render  200",
		);
	} else if (config.target === "cloudflare-workers") {
		// eslint-disable-next-line no-console
		console.log(chalk.gray("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions"), {
			recursive: true,
		});

		await esbuild({
			bundle: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "index.js"),
			platform: "browser",
			target: "node12",
			format: "cjs",
		});

		await fs.promises.writeFile(
			path.join(outDir, "package.json"),
			`{"main":"index.js"}`,
		);
	}

	if (config.target === "static") {
		await crawl(outDir);
	} else {
		// eslint-disable-next-line no-console
		console.log(
			chalk.whiteBright("Application built in "),
			chalk.green(outDir),
		);
	}
}

async function crawl(outDir: string) {
	const host = "localhost";
	const port = await getPort();

	// eslint-disable-next-line no-console
	console.log(chalk.whiteBright("Launching server"));

	const server = spawn("node node_modules/.rakkas/static/server", {
		shell: true,
		env: { ...process.env, HOST: host, PORT: String(port) },
		stdio: "ignore",
	});

	server.on("error", (error) => {
		throw error;
	});

	let firstResponse: Response | undefined;

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Waiting for server to respond"));
	for (;;) {
		try {
			firstResponse = await fetch(`http://${host}:${port}`, {
				headers: { "x-rakkas-export": "static" },
			});
		} catch (err) {
			if (err instanceof FetchError) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				continue;
			}
			throw err;
		}

		break;
	}

	// eslint-disable-next-line no-console
	console.log(chalk.whiteBright("Crawling the application"));
	const roots = new Set(["/"]);
	const origin = `http://${host}:${port}`;
	for (const root of roots) {
		const currentUrl = origin + root;

		const response =
			firstResponse ||
			(await fetch(currentUrl, {
				headers: { "x-rakkas-export": "static" },
			}));

		firstResponse = undefined;

		if (response.headers.get("x-rakkas-export") !== "static") continue;

		if (!response.ok) {
			// eslint-disable-next-line no-console
			console.log(
				chalk.yellowBright(
					`Request to ${root} returned status ${response.status}.`,
				),
			);
		}

		// eslint-disable-next-line no-inner-declarations
		function addPath(path: string) {
			const url = new URL(path, currentUrl);
			if (url.origin === origin) {
				roots.add(url.pathname);
			}
		}

		const location = response.headers.get("location");
		if (location) addPath(location);

		// eslint-disable-next-line no-console
		console.log(chalk.gray("Exported page"), chalk.blue(root));

		const fetched = await response.text();

		const dom = cheerio.load(fetched);

		dom("a[href]").each((i, el) => addPath(el.attribs.href));
	}

	await fs.promises.mkdir("dist", { recursive: true });

	await new Promise<void>((resolve, reject) =>
		rimraf("dist/static", (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		}),
	);

	await fs.promises.rename(path.join(outDir, "client"), "dist/static");

	await new Promise((resolve) => {
		server.on("exit", resolve);
		server.kill();
	});

	await new Promise<void>((resolve, reject) =>
		rimraf(outDir, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		}),
	);

	// eslint-disable-next-line no-console
	console.log(
		chalk.whiteBright("Static application exported into the directory"),
		chalk.green("dist/static"),
	);
}
