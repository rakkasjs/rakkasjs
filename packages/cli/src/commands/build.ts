import commander from "commander";
import { build as viteBuild } from "vite";
import { loadConfig } from "../lib/config";
import { makeViteConfig } from "../lib/vite-config";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import micromatch from "micromatch";
import chalk from "chalk";
import { RakkasDeploymentTarget, FullConfig } from "../..";
import rimraf from "rimraf";
import { build as esbuild, BuildOptions as ESBuildOptions } from "esbuild";
import { builtinModules } from "module";
import type {
	handleRequest as HandleRequest,
	Route,
} from "rakkasjs/dist/server";
import { installNodeFetch } from "../runtime/install-node-fetch";
import { spawn } from "child_process";
import { Headers } from "node-fetch";

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
	console.log(chalk.gray("Building client"));

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

	if (deploymentTarget !== "static") {
		await fs.promises.unlink(path.join(clientOutDir, "ssr-manifest.json"));
		await fs.promises.unlink(path.join(clientOutDir, "import-manifest.json"));
	}

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building server"));

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
					"/virtual:/@rakkasjs/page-routes",
					"/virtual:/@rakkasjs/api-routes",
					"/virtual:/rakkasjs/server",
				],
				output:
					deploymentTarget === "cloudflare-workers"
						? { format: "es" }
						: undefined,
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
			`module.exports = ${JSON.stringify(dom.html())}`,
			"utf8",
		);

		await fs.promises.copyFile(entry!, path.join(serverOutDir, "index.js"));
	}

	if (deploymentTarget === "vercel") {
		// eslint-disable-next-line no-console
		console.log(chalk.gray("Bundling serverless fuction"));

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
		console.log(chalk.gray("Bundling serverless fuction"));

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
		console.log(chalk.gray("Bundling serverless fuction"));

		await fs.promises.mkdir(path.join(outDir, "functions"), {
			recursive: true,
		});

		const esbuilfOptions: ESBuildOptions = {
			bundle: true,
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
		await crawl(outDir, dom.html(), manifest);
	} else {
		// eslint-disable-next-line no-console
		console.log(
			chalk.whiteBright("Application built in "),
			chalk.green(outDir),
		);
	}
}

async function crawl(
	outDir: string,
	htmlTemplate: string,
	manifest: Record<string, string[]>,
) {
	// eslint-disable-next-line no-console
	console.log(chalk.whiteBright("Prerendering static routes"));

	const server = await (0, eval)(
		`import(${JSON.stringify(path.join(outDir, "server/server.js"))})`,
	);

	const handleRequest: typeof HandleRequest = server.handleRequest;

	const pageRoutes: Route[] = (
		await (0, eval)(
			`import(${JSON.stringify(path.join(outDir, "server/page-routes.js"))})`,
		)
	).default.default;

	const apiRoutes: Route[] = (
		await (0, eval)(
			`import(${JSON.stringify(path.join(outDir, "server/api-routes.js"))})`,
		)
	).default.default;

	const roots = new Set(["/"]);
	const origin = `http://localhost`;

	installNodeFetch();

	const clientDir = path.resolve(outDir, "client");

	for (const root of roots) {
		const currentUrl = new URL(origin + root);

		const response = await handleRequest({
			htmlTemplate,
			pageRoutes,
			apiRoutes,
			manifest,
			async writeFile(name, content) {
				try {
					const fullname = clientDir + name;
					const dir = path.parse(fullname).dir;

					// eslint-disable-next-line no-console
					console.log(chalk.gray(name));

					await fs.promises.mkdir(dir, { recursive: true });
					await fs.promises.writeFile(fullname, content);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(error);
				}
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

		if (typeof response.body !== "string") {
			// eslint-disable-next-line no-console
			console.log(
				chalk.yellowBright(`Request to ${root} returned unknown body type.`),
			);
		} else {
			const dom = cheerio.load(response.body);
			dom("a[href]").each((_, el) => addPath(el.attribs.href));
		}
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
