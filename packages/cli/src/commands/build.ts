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
			console.log(chalk.whiteBright(`Building for target "${config.target}"`));

			const result = await build(config);

			return result;
		});

	return cmd;
}

export interface BuildOptions {
	buildMode?: "ssr" | "static";
	outDir?: string;
}

export async function build(config: FullConfig) {
	const outDir = path.resolve("dist");

	// eslint-disable-next-line no-console
	console.log(chalk.gray("Building client"));

	const clientConfig = await makeViteConfig(config, { ssr: false });

	await viteBuild({
		...clientConfig,

		build: {
			outDir: path.join(outDir, "client"),
			emptyOutDir: true,
			ssrManifest: true,
			target: "es2020",
		},
	});

	const ssrConfig = await makeViteConfig(config, { ssr: true });

	// Fix index.html
	const htmlTemplate = await fs.promises.readFile(
		path.join(outDir, "client", "index.html"),
	);

	const dom = cheerio.load(htmlTemplate);

	const html = dom("html").first();
	Object.keys(html.attr()).forEach((a) => html.removeAttr(a));
	html.prepend("<!-- rakkas-html-attributes-placeholder -->");

	const body = html.find("body").first();
	Object.keys(body.attr()).forEach((a) => body.removeAttr(a));
	body.prepend("<!-- rakkas-body-attributes-placeholder -->");

	await fs.promises.writeFile(
		path.join(outDir, "html-template.js"),
		`module.exports = ${JSON.stringify(dom.html())}`,
		"utf8",
	);

	await fs.promises.unlink(path.join(outDir, "client", "index.html"));

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

	await viteBuild({
		...ssrConfig,

		build: {
			ssr: true,
			target: "node12",
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

	await fs.promises.copyFile(
		path.resolve(__dirname, "./entries/entry-node.js"),
		path.join(outDir, "server", "index.js"),
	);

	// eslint-disable-next-line no-console
	console.log(chalk.whiteBright(`Application built in ${outDir}`));
}
