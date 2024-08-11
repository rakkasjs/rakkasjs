import type { Plugin } from "vite";
// eslint-disable-next-line import/no-named-as-default
import glob from "fast-glob";
import path from "node:path";
import micromatch from "micromatch";
import { pathToFileURL } from "node:url";
import pico from "picocolors";
import type { BaseRouteConfig, RouteConfig } from "../lib";

export function fsRoutes(): Plugin {
	let resolveConfigResolvedPromise: () => void;
	const configResolvedPromise = new Promise<void>((resolve) => {
		resolveConfigResolvedPromise = resolve;
	});

	let root: string;
	let configs: Array<{
		dir: string;
		value: RouteConfig;
	}>;

	const isPage = micromatch.matcher("**/*.page.*");
	const isLayout = createMatcher("layout");
	const isGuard = micromatch.matcher("**/*.guard.*");
	const isDirGuard = createMatcher("$guard");
	const isApi = micromatch.matcher("**/*.api.*");
	const isMiddleware = createMatcher("middleware");

	const isDottedRouteFile = micromatch.matcher(
		"**/*.(page|layout|guard|$guard|api|middleware|404).*",
	);
	const isUndottedRouteFile = micromatch.matcher(
		"**/(layout|middleware|$guard).*",
	);
	const isCssFile = micromatch.matcher(
		"**/*.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)",
	);
	const isRouteFile = (filename: string) => {
		filename = toPosix(filename);

		return (
			filename.startsWith(path.posix.join(root, "src/routes/")) &&
			(isDottedRouteFile(filename) || isUndottedRouteFile(filename)) &&
			!isCssFile(filename)
		);
	};

	let routesChanged: () => void;

	const result: Plugin = {
		name: "rakkasjs:fs-routes",

		api: {
			rakkas: {
				async getRoutes() {
					await configResolvedPromise;
					let files = await glob(
						[
							"**/*.(page|layout|guard|$guard|api|middleware|404).*",
							"**/(layout|middleware|$guard).*",
							"!**/*.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)",
						],
						{ cwd: path.join(root, "src/routes") },
					);

					if (path.sep !== "/") {
						files = files.map((x) => x.replaceAll(path.sep, "/"));
					}

					// The arrow function is necessary here, not sure why
					const pages = files.filter((x) => isPage(x));
					const layouts = files.filter((x) => isLayout(x)).sort(shortToLong);
					const guards = files.filter((x) => isGuard(x));
					const dirGuards = files
						.filter((x) => isDirGuard(x))
						.sort(shortToLong);
					const apis = files.filter((x) => isApi(x));
					const middlewares = files
						.filter((x) => isMiddleware(x))
						.sort(shortToLong);

					function getRenderMode(
						filename: string,
					): false | "hydrate" | "server" | "client" {
						const defaults: BaseRouteConfig = {};

						for (const config of configs) {
							if (filename.startsWith(config.dir)) {
								if (config.value.disabled) {
									return false;
								}

								if (config.value.renderingMode) {
									return config.value.renderingMode;
								}

								Object.assign(defaults, config.value.defaults);
							}
						}

						return defaults.disabled === false
							? false
							: (defaults.renderingMode ?? "hydrate");
					}

					return [
						...pages
							.map((page) => {
								const path = filenameToPathPattern(page);
								return {
									type: "page" as const,
									path,
									page: "/src/routes/" + page,
									layouts: layouts
										.filter((layout) => wraps(layout, page))
										.map((x) => "/src/routes/" + x),
									guards: [
										...dirGuards
											.filter((guard) => wraps(guard, page))
											.map((x) => "/src/routes/" + x),
										...guards
											.filter((guard) => isCompanion(guard, page))
											.map((x) => "/src/routes/" + x),
									],
									renderingMode: getRenderMode("/src/routes/" + page) as
										| "hydrate"
										| "server"
										| "client",
									is404: path.endsWith("/$404"),
								};
							})
							.filter((x) => (x.renderingMode as any) !== false),
						...apis
							.map((api) => ({
								type: "api" as const,
								path: filenameToPathPattern(api),
								handler: "/src/routes/" + api,
								middleware: middlewares
									.filter((middleware) => wraps(middleware, api))
									.map((x) => "/src/routes/" + x),
							}))
							.filter((x) => getRenderMode(x.handler) !== false),
					];
				},
			},
		},

		async configResolved(config) {
			root = config.root;

			const routeConfigFiles = await glob(
				root + "/src/routes/**/route.config.js",
			);

			const routeConfigContents = await Promise.allSettled(
				routeConfigFiles.map((file) => {
					const specifier = pathToFileURL(file) + `?${cacheBuster}`;
					return import(specifier).then((module) => module.default);
				}),
			);
			cacheBuster++;

			const routeConfigs = routeConfigContents.map((result, i) => ({
				file: routeConfigFiles[i].slice(root.length),
				...result,
			}));

			const failed = routeConfigs.find(
				(c) => c.status === "rejected",
			) as PromiseRejectedResult & { file: string };

			if (failed) {
				const message = `Failed to load ${failed.file}: ${failed.reason.stack}`;
				if (config.command === "build") {
					throw new Error(message);
				} else {
					config.logger.error(pico.red(message));
				}
			}

			config.configFileDependencies.push(...routeConfigFiles);

			configs = [];
			for (const routeConfig of routeConfigs) {
				if (routeConfig.status === "fulfilled") {
					try {
						const value =
							typeof routeConfig.value === "function"
								? routeConfig.value(config)
								: routeConfig.value;

						configs.push({
							dir: routeConfig.file
								.slice(0, -"route.config.js".length)
								.replace(/\\/g, "/"),
							value,
						});
					} catch (error: any) {
						const message = `Failed to evaluate ${routeConfig.file}: ${error?.stack}`;
						if (config.command === "build") {
							throw new Error(message);
						} else {
							config.logger.error(pico.red(message));
						}
					}
				}
			}

			// Shortest first
			configs.sort((a, b) => a.dir.length - b.dir.length);

			routesChanged = () => {
				for (const plugin of config.plugins) {
					plugin.api?.rakkas?.routesChanged?.();
				}
			};

			resolveConfigResolvedPromise();
		},

		configureServer(server) {
			const isRouteConfig = micromatch.matcher(
				"/src/routes/**/route.config.js",
			);

			server.watcher.addListener("all", (ev: string, file: string) => {
				if (isRouteConfig(file) && (ev === "add" || ev === "unlink")) {
					server.config.logger.info(
						pico.green(
							`${path.relative(
								process.cwd(),
								file,
							)} changed, restarting server...`,
						),
						{ clear: true, timestamp: true },
					);
					server.restart().catch(() => {
						// Ignore
					});
				}

				if (isRouteFile(file) && (ev === "add" || ev === "unlink")) {
					routesChanged();
				}
			});
		},
	};

	return result;
}

function createMatcher(keyword: string) {
	const isUnnamed = micromatch.matcher(`**/${keyword}.*`);
	const isNamed = micromatch.matcher(`**/*.${keyword}.*`);
	return (filename: string) => isUnnamed(filename) || isNamed(filename);
}

function isCompanion(companion: string, target: string) {
	return withoutExtension(companion) === withoutExtension(target);
}

function wraps(wrapper: string, target: string) {
	const wrapperDir = path.dirname(wrapper);
	const targetDir = path.dirname(target);

	return (
		wrapperDir === "." ||
		wrapperDir === targetDir ||
		targetDir.startsWith(wrapperDir + "/")
	);
}

function withoutExtension(filename: string) {
	return filename.replace(
		/\.(?:page|layout|guard|\$guard|api|middleware|404)\.[^/.]+$/,
		"",
	);
}

function filenameToPathPattern(filename: string) {
	return (
		"/" +
		withoutExtension(filename)
			.split(/(?:--|\/)/)
			.filter(
				(s) =>
					s[0] !== "_" && s !== "index" && !(s[0] === "(" && s.endsWith(")")),
			)
			.join("/")
	);
}

function shortToLong(a: string, b: string) {
	return a.length - b.length;
}

function toPosix(name: string) {
	if (path.sep !== "/") {
		return name.replaceAll(path.sep, "/");
	}

	return name;
}

let cacheBuster = 0;
