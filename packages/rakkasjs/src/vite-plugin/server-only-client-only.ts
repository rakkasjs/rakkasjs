import { createFilter, type Plugin, type FilterPattern } from "vite";
import { init, parse } from "es-module-lexer";

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
		options.serverOnlyFiles?.exclude,
	);

	const clientOnlyFilter = createFilter(
		options.clientOnlyFiles?.include ?? ["**/*.client.*", "**/client/**"],
		options.clientOnlyFiles?.exclude,
	);

	return {
		name: "rakkasjs:server-only-client-only",

		enforce: "post",

		async transform(code, id, options) {
			await init;

			if (
				(options?.ssr && clientOnlyFilter(id)) ||
				(!options?.ssr && serverOnlyFilter(id))
			) {
				if (id.match(/\.(?:css|scss|sass|less|styl|stylus)(?:\?|$)/)) {
					return;
				}

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
