import { createFilter, type Plugin, type FilterPattern } from "vite";
import { init, parse } from "es-module-lexer";
import path from "node:path";

export interface ServerOnlyClientOnlyOptions {
	serverOnlyFiles?: {
		include?: FilterPattern;
		exclude?: FilterPattern;
	};
	clientOnlyFiles?: {
		include?: FilterPattern;
		exclude?: FilterPattern;
	};
}

export function serverOnlyClientOnly(
	options: ServerOnlyClientOnlyOptions = {},
): Plugin {
	const serverOnlyFilter = createFilter(
		options.serverOnlyFiles?.include ?? ["**/*.server.*", "**/server/**"],
		[
			...normalizeFilterPattern(options.serverOnlyFiles?.exclude),
			"**/node_modules/**",
		],
	);

	const clientOnlyFilter = createFilter(
		options.clientOnlyFiles?.include ?? ["**/*.client.*", "**/client/**"],
		[
			...normalizeFilterPattern(options.clientOnlyFiles?.exclude),
			"**/node_modules/**",
		],
	);

	let root: string;

	return {
		name: "rakkasjs:server-only-client-only",

		enforce: "post",

		config(config) {
			root = path.posix
				.normalize(config.root ?? process.cwd())
				.replace(/\\/g, "/");
			if (!root.endsWith("/")) {
				root += "/";
			}
		},

		async transform(code, id, options) {
			await init;

			if (
				(options?.ssr && clientOnlyFilter(id)) ||
				(!options?.ssr && serverOnlyFilter(id))
			) {
				if (
					!id.startsWith(root) ||
					id.match(/\.(?:css|scss|sass|less|styl|stylus)(?:\?|$)/)
				) {
					return;
				}

				id = id.slice(root.length);

				const [, exports] = parse(code);

				let output =
					"// This file is excluded from the " +
					(options?.ssr ? "server" : "client") +
					" bundle\n";
				for (const { n } of exports) {
					output +=
						n === "default"
							? "export default undefined;\n"
							: `export const ${n} = undefined;\n`;
				}

				return {
					code: output,
				};
			}
		},
	};
}

function normalizeFilterPattern(
	pattern?: FilterPattern,
): Array<string | RegExp> {
	return Array.isArray(pattern) ? pattern : pattern ? [pattern] : [];
}
