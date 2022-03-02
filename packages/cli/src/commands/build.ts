import chalk from "chalk";
import cheerio from "cheerio";
import { spawn } from "child_process";
import commander from "commander";
import { build as esbuild, BuildOptions as ESBuildOptions } from "esbuild";
import fs from "fs";
import micromatch from "micromatch";
import { builtinModules } from "module";
import { Headers } from "node-fetch";
import path from "path";
import { RakkasResponse } from "rakkasjs";
import type {
	handleRequest as HandleRequest,
	Route,
} from "rakkasjs/dist/server";
import rimraf from "rimraf";
import { build as viteBuild } from "vite";
import { FullConfig, RakkasDeploymentTarget } from "../..";
import { loadConfig } from "../lib/config";
import { importJs } from "../lib/importJs";
import { makeViteConfig } from "../lib/vite-config";
import { installNodeFetch } from "../runtime/install-node-fetch";

const { createCommand, Option } = commander;

const TARGETS: RakkasDeploymentTarget[] = [
	"node",
	"static",
	"vercel",
	"netlify",
	"cloudflare-workers",
];

interface BuildCommandOptions {
	deploymentTarget: RakkasDeploymentTarget;
}

export default function buildCommand() {
	const cmd = createCommand("build")
		.description("Build for production")
		.addOption(
			new Option("-d, --deployment-target <target>", "Deployment target")
				.choices(TARGETS)
				.default("node"),
		)
		.action(async (options: BuildCommandOptions) => {
			const { config } = await loadConfig({
				command: "build",
				deploymentTarget: options.deploymentTarget,
			});

			// eslint-disable-next-line no-console
			console.log(
				chalk.whiteBright("Building for deployment target"),
				chalk.yellowBright(options.deploymentTarget),
			);

			const result = await build(config, options.deploymentTarget);

			return result;
		});

	return cmd;
}

export async function build(
	config: FullConfig,
	deploymentTarget: RakkasDeploymentTarget,
) {
	let outDir: string;
	let clientOutDir: string;
	let serverOutDir: string;
	let entry: string | undefined;

	switch (deploymentTarget) {
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
			throw new Error(`Build target ${deploymentTarget} is not supported yet`);
	}

	await fs.promises.mkdir(clientOutDir, { recursive: true });
	await fs.promises.mkdir(serverOutDir, { recursive: true });

	// eslint-disable-next-line no-console
	console.log(chalk.blue("Building client"));

	const buildId = await getBuildId();

	const clientConfig = await makeViteConfig(config, deploymentTarget, buildId, {
		ssr: false,
	});

	await viteBuild({
		...clientConfig,

		build: {
			outDir: clientOutDir,
			emptyOutDir: true,
			ssrManifest: true,
			target: "es2020",
		},
	});

	const ssrConfig = await makeViteConfig(config, deploymentTarget, buildId, {
		ssr: true,
	});

	// Fix index.html
	const htmlTemplate = await fs.promises.readFile(
		path.join(clientOutDir, "index.html"),
		"utf-8",
	);

	const dom = cheerio.load(htmlTemplate);

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

	if (deploymentTarget !== "static") {
		await fs.promises.unlink(path.join(clientOutDir, "ssr-manifest.json"));
		await fs.promises.unlink(path.join(clientOutDir, "import-manifest.json"));
	}

	// eslint-disable-next-line no-console
	console.log(chalk.blue("Building server"));

	if (deploymentTarget === "cloudflare-workers") {
		ssrConfig.ssr.target = "webworker";
		ssrConfig.resolve = ssrConfig.resolve || {};
		ssrConfig.resolve.mainFields = ["module", "main", "browser"];
		ssrConfig.resolve.conditions = ssrConfig.resolve.conditions || [];
		ssrConfig.resolve.conditions.push("worker");
	}

	await viteBuild({
		...ssrConfig,

		build: {
			ssr: true,
			target: "node12",
			outDir: serverOutDir,
			rollupOptions: {
				input: [
					"virtual:rakkasjs:page-routes",
					"virtual:rakkasjs:api-routes",
					"virtual:rakkasjs:server",
					"virtual:rakkasjs:placeholder-loader",
				],
				output: undefined,
			},
			emptyOutDir: true,
		},

		publicDir: false,
	});

	if (deploymentTarget !== "static") {
		await fs.promises.writeFile(
			path.join(serverOutDir, "rakkas-manifest.json"),
			JSON.stringify(manifest),
			"utf8",
		);

		await fs.promises.writeFile(
			path.join(serverOutDir, "html-template.js"),
			`module.exports=${JSON.stringify(dom.html())}`,
			"utf8",
		);

		await fs.promises.copyFile(entry!, path.join(serverOutDir, "index.js"));
	}

	const pageRoutes: Route[] = (
		await importJs(path.join(serverOutDir, "virtual_rakkasjs_page-routes.js"))
	).default.default;

	installNodeFetch();

	const htmlContents = dom.html();

	const placeholderLoader = path.join(serverOutDir, "placeholder-loader.js");

	const htmlPlaceholder = await (
		await importJs(placeholderLoader)
	).default.default(htmlContents, pageRoutes);

	await fs.promises.unlink(placeholderLoader);

	fs.promises.writeFile(
		path.join(serverOutDir, "placeholder.js"),
		`module.exports=${JSON.stringify(htmlPlaceholder)}`,
		"utf8",
	);

	await prerender(
		config,
		serverOutDir,
		clientOutDir,
		htmlContents,
		htmlPlaceholder,
		manifest,
		config.prerender,
		pageRoutes,
		deploymentTarget,
	);

	if (deploymentTarget === "vercel") {
		// eslint-disable-next-line no-console
		console.log(chalk.blue("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions/node/render"), {
			recursive: true,
		});

		const esbuilfOptions: ESBuildOptions = {
			bundle: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "functions/node/render/index.js"),
			platform: "node",
			target: "node12",
			format: "cjs",
		};

		config.modifyEsbuildOptions?.(esbuilfOptions);

		await esbuild(esbuilfOptions);
	} else if (deploymentTarget === "netlify") {
		// eslint-disable-next-line no-console
		console.log(chalk.blue("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions"), {
			recursive: true,
		});

		const esbuilfOptions: ESBuildOptions = {
			bundle: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "functions/render.js"),
			platform: "node",
			target: "node12",
			format: "cjs",
		};

		config.modifyEsbuildOptions?.(esbuilfOptions);

		await esbuild(esbuilfOptions);

		await fs.promises.writeFile(
			path.join(clientOutDir, "_redirects"),
			"/*  /.netlify/functions/render  200",
		);
	} else if (deploymentTarget === "cloudflare-workers") {
		// eslint-disable-next-line no-console
		console.log(chalk.blue("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions"), {
			recursive: true,
		});

		const esbuilfOptions: ESBuildOptions = {
			bundle: true,
			minify: true,
			entryPoints: [path.join(serverOutDir, "index.js")],
			outfile: path.join(outDir, "index.js"),
			platform: "browser",
			target: "node12",
			format: "esm",
			mainFields: ["module", "main", "browser"],
			external: builtinModules,
		};

		config.modifyEsbuildOptions?.(esbuilfOptions);

		await esbuild(esbuilfOptions);

		await fs.promises.writeFile(
			path.join(outDir, "package.json"),
			`{"main":"index.js"}`,
		);
	}

	if (deploymentTarget === "static") {
		await fs.promises.mkdir("dist", { recursive: true });

		await new Promise<void>((resolve, reject) =>
			rimraf("dist", (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}),
		);

		await fs.promises.rename(path.join(outDir, "client"), "dist");

		await fs.promises.copyFile(
			path.resolve(__dirname, "./entries/entry-language-detect.js"),
			"dist/lang-redir.js",
		);

		await new Promise<void>((resolve, reject) =>
			rimraf(outDir, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}),
		);

		outDir = path.resolve("dist");
	}

	// eslint-disable-next-line no-console
	console.log(chalk.whiteBright("Application built in "), chalk.green(outDir));
}

async function prerender(
	config: FullConfig,
	serverOutDir: string,
	clientOutDir: string,
	htmlTemplate: string,
	htmlPlaceholder: string,
	manifest: Record<string, string[]>,
	prerender: string[],
	pageRoutes: Route[],
	deploymentTarget: RakkasDeploymentTarget,
) {
	if (!prerender.length) return;

	// eslint-disable-next-line no-console
	console.log(chalk.blue("Pre-rendering static routes"));

	const server = await importJs(path.join(serverOutDir, "server.js"));

	const handleRequest: typeof HandleRequest = server.handleRequest;

	const apiRoutes: Route[] = (
		await importJs(path.join(serverOutDir, "virtual_rakkasjs_api-routes.js"))
	).default.default;

	const roots = new Set(prerender);
	const origin = `http://localhost`;

	const prerendered: Record<
		string,
		{
			content: RakkasResponse;
			filename: string;
		}
	> = {};

	const decoder = new TextDecoder("utf-8");

	for (const root of roots) {
		const currentUrl = new URL(origin + root);

		const response = await handleRequest({
			prerendering: true,
			htmlTemplate,
			htmlPlaceholder,
			pageRoutes,
			apiRoutes,
			manifest,

			async saveResponse(name, response) {
				try {
					const fullname = clientOutDir + name;
					const dir = path.parse(fullname).dir;

					const { body, ...bodiless } = response;

					let content = body;
					if (content === undefined || content === null) {
						content = "";
					} else if (
						typeof content !== "string" &&
						!(content instanceof Uint8Array)
					) {
						content = JSON.stringify(content);
					}

					// eslint-disable-next-line no-console
					console.log(chalk.gray(name));

					await fs.promises.mkdir(dir, { recursive: true });
					await fs.promises.writeFile(fullname, content as any);

					prerendered[name] = {
						content: bodiless,
						filename: fullname,
					};
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(error);
				}
			},

			async getCachedResponse(name) {
				const response =
					prerendered[name] ||
					prerendered[
						name.endsWith("/") ? name + "index.html" : name + "/index.html"
					];

				if (!response) {
					return undefined;
				}

				const body = await fs.promises.readFile(response.filename);

				return {
					response: {
						...response.content,
						body,
					},
					expired: false,
				};
			},

			request: {
				url: currentUrl,
				ip: "",
				method: "GET",
				headers: new Headers() as any,
				originalIp: "",
				originalUrl: currentUrl,
				type: "empty",
			},
		});

		let replyHeaders = response.headers || [];

		if (!Array.isArray(replyHeaders)) {
			replyHeaders = Object.entries(replyHeaders);
		}

		if ((response.status || 200) > 399) {
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

		const location = replyHeaders.find(
			(x) => x[0].toLowerCase() === "location",
		)?.[1];

		if (typeof location === "string") addPath(location);

		const contentType = replyHeaders.find(
			(x) => x[0].toLowerCase() === "content-type",
		)?.[1];

		const prerenderHeader = replyHeaders.find(
			(x) => x[0].toLowerCase() === "x-rakkas-prerender",
		)?.[1];

		if (prerenderHeader === "language-redirect") {
			const redirects: Record<string, string> = response.body as any;
			for (const [, path] of Object.entries(redirects)) {
				addPath(path);
			}

			if (deploymentTarget === "static" && config.locales?.detect) {
				const content = renderLanguageRedirectPage(
					redirects,
					config.locales?.default || "en",
					config.locales?.cookieName,
				);
				let name = currentUrl.pathname;
				if (!name.endsWith("/")) name += "/";
				name += "/index.html";

				const fullname = clientOutDir + name;
				const dir = path.parse(fullname).dir;

				// eslint-disable-next-line no-console
				console.log(chalk.gray(name));

				await fs.promises.mkdir(dir, { recursive: true });
				await fs.promises.writeFile(fullname, content);

				prerendered[name] = {
					content: { headers: response.headers, status: response.status },
					filename: fullname,
				};
			}
		} else if (contentType === "text/html") {
			const noCrawl = prerenderHeader === "no-crawl";

			if (!noCrawl) {
				if (response.body === undefined || response.body === null) {
					response.body = "";
				} else if (typeof response.body !== "string") {
					if (response.body instanceof Uint8Array) {
						response.body = decoder.decode(response.body);
					} else {
						response.body = JSON.stringify(response.body);
					}
				}

				const dom = cheerio.load(response.body as string);
				dom("a[href]").each((_, el) => addPath(el.attribs.href));
				dom("area[href]").each((_, el) => addPath(el.attribs.href));
			}
		}
	}
}

async function getBuildId(): Promise<string> {
	return await new Promise<string>((resolve) => {
		const git = spawn("git", ["rev-parse", "HEAD"], {
			stdio: ["ignore", "pipe", "ignore"],
		});

		git.stdout.setEncoding("utf8");
		let output = "";

		git.stdout.on("data", (data) => {
			output += data;
		});

		git.on("close", (code) => {
			if (code === 0) {
				resolve(output.trim().slice(0, 11));
			} else {
				// Return a random hash if git fails
				resolve(Math.random().toString(36).substring(2, 15));
			}
		});
	});
}

function renderLanguageRedirectPage(
	redirects: Record<string, string>,
	defaultLocale: string,
	coookieName?: string,
): string {
	let anchors = "";
	let links = "";
	for (const [lang, url] of Object.entries(redirects)) {
		let displayName = lang;
		try {
			displayName = new (Intl as any).DisplayNames(lang, {
				type: "language",
			})
				.of(lang)
				.toLocaleUpperCase(lang);
		} catch {
			// Do nothing
		}

		anchors += `<li><a href="${escapeHtml(
			url,
		)}" hreflang="${lang}" lang="${lang}">${escapeHtml(displayName)}</a></li>`;

		links += `<link rel="alternate" hreflang="${lang}" href="${escapeHtml(
			url,
		)}" />`;
	}

	return `<!DOCTYPE html><html><head><meta charset="utf-8">${links}</head><body><noscript><ul>${anchors}</ul></noscript><script>RAKKAS_DEFAULT_LOCALE=${JSON.stringify(
		defaultLocale,
	)};RAKKAS_LOCALE_COOKIE_NAME=${JSON.stringify(
		coookieName,
	)}</script><script src="/lang-redir.js"></script></body></html>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
