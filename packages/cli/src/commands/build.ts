import { Command } from "commander";
import { build as viteBuild } from "vite";
import { loadConfig } from "../lib/config";
import { makeViteConfig } from "../lib/vite-config";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import micromatch from "micromatch";
import chalk from "chalk";

export default function buildCommand() {
	return new Command("build")
		.description("Build for production")
		.action(async () => {
			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Building for production"));

			const result = await build();

			// eslint-disable-next-line no-console
			console.log(
				chalk.whiteBright("Production application built into the directory"),
				chalk.green("dist"),
			);

			return result;
		});
}

export interface BuildOptions {
	buildMode?: "ssr" | "static";
	outDir?: string;
}

export async function build(options: BuildOptions = {}) {
	const { buildMode = "ssr", outDir = path.resolve("dist") } = options;
	const { config } = await loadConfig();
	let viteConfig = await makeViteConfig(config, {
		buildMode,
		stripLoadFunctions: buildMode === "static",
	});

	viteConfig.logLevel = "warn";

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building client"));

	await viteBuild({
		...viteConfig,

		build: {
			outDir: path.join(outDir, "client"),
			emptyOutDir: true,
			ssrManifest: true,
		},
	});

	viteConfig = await makeViteConfig(config, { buildMode });
	viteConfig.logLevel = "warn";

	// Fix index.html
	const template = await fs.promises.readFile(
		path.join(outDir, "client", "index.html"),
	);

	const dom = cheerio.load(template);

	const html = dom("html").first();
	Object.keys(html.attr()).forEach((a) => html.removeAttr(a));
	html.prepend("<!-- rakkas-html-attributes-placeholder -->");

	const body = html.find("body").first();
	Object.keys(body.attr()).forEach((a) => body.removeAttr(a));
	body.prepend("<!-- rakkas-body-attributes-placeholder -->");

	fs.promises.writeFile(path.join(outDir, "index.html"), dom.html(), "utf8");
	fs.promises.unlink(path.join(outDir, "client", "index.html"));

	// Fix manifest
	const rawManifest = JSON.parse(
		await fs.promises.readFile(
			path.join(outDir, "client", "ssr-manifest.json"),
			"utf-8",
		),
	) as Record<string, string[]>;

	const importManifest = JSON.parse(
		await fs.promises.readFile(
			path.join(outDir, "client", "import-manifest.json"),
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

	fs.promises.writeFile(
		path.join(outDir, "rakkas-manifest.json"),
		JSON.stringify(manifest),
		"utf8",
	);
	fs.promises.unlink(path.join(outDir, "client", "ssr-manifest.json"));
	fs.promises.unlink(path.join(outDir, "client", "import-manifest.json"));

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building server"));
	// Build server
	await viteBuild({
		...viteConfig,

		build: {
			ssr: true,
			target: "modules",
			outDir: path.join(outDir, "server"),
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
}
