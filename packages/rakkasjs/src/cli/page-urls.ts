/* eslint-disable import/no-named-as-default-member */
// eslint-disable-next-line import/no-named-as-default
import glob from "fast-glob";
import ts from "typescript";
import { normalizePathSegment } from "../internal/route-utils";
import { writeFileSync } from "node:fs";

export async function generatePageUrlBuilder({
	search: searchModule,
}: { search?: string } = {}) {
	const pageModules = (
		await glob("**/*.page.tsx", {
			cwd: "src/routes",
		})
	).filter((m) => !m.endsWith("$404.page.tsx"));

	const parsedConfig = ts.readConfigFile("tsconfig.json", ts.sys.readFile);

	if (parsedConfig.error) {
		console.error(parsedConfig.error);
		throw new Error("Failed to parse tsconfig.json");
	}

	const config = ts.parseJsonConfigFileContent(
		parsedConfig.config,
		ts.sys,
		"./",
	);

	const program = ts.createProgram({
		rootNames: pageModules.map((m) => "src/routes/" + m),
		options: config.options,
	});

	const names = new Map<
		string,
		{
			path: string;
			search?: string;
			hash?: string;
		}
	>();

	for (const path of pageModules) {
		const sf = program.getSourceFile("src/routes/" + path);

		const checker = program.getTypeChecker();
		const sourceFileSymbol = checker.getSymbolAtLocation(sf!)!;
		const exports = checker.getExportsOfModule(sourceFileSymbol);

		// Get default export's local name
		const defaultExport = exports.find((e) => e.escapedName === "default");

		const firstDecl = defaultExport?.declarations?.[0] as any;
		let defaultExportName =
			firstDecl?.propertyName?.escapedText ??
			firstDecl?.name?.escapedText ??
			firstDecl?.expression?.escapedText;

		if (!defaultExportName || defaultExportName === "default") {
			console.warn(`No default export name found in ${path}`);
			continue;
		}

		const search = (
			exports.find((e) => e.escapedName === defaultExportName + "Search")
				?.declarations?.[0] as any
		)?.name?.escapedText;

		const hash = (
			exports.find((e) => e.escapedName === defaultExportName + "Hash")
				?.declarations?.[0] as any
		)?.name?.escapedText;

		if (defaultExportName.endsWith("Page")) {
			defaultExportName = defaultExportName.slice(0, -4);
		}

		defaultExportName =
			defaultExportName[0].toLowerCase() + defaultExportName.slice(1);

		if (names.has(defaultExportName)) {
			console.warn(
				`Duplicate default export name "${defaultExportName}" found in "${path}" (previously used in "${names.get(defaultExportName)}").`,
			);
		}

		names.set(defaultExportName, {
			path,
			search,
			hash,
		});
	}

	// Disable ESLint for the output
	let output = `/* eslint-disable */\n`;

	if ([...names.values()].some((n) => n.search)) {
		if (searchModule) {
			const [module, symbol] = searchModule.split("::");
			if (!symbol) {
				output += `import _s from ${JSON.stringify(module)};\n`;
			} else {
				output += `import { ${symbol} as _s } from ${JSON.stringify(module)};\n`;
			}
		}
	}

	for (const [, { path, search, hash }] of names) {
		if (!search && !hash) {
			continue;
		}

		output += "import type { ";

		output += [search, hash].filter(Boolean).join(", ");

		output += ` } from ${JSON.stringify("./routes/" + path.slice(0, -4))};\n`;
	}

	if (output) {
		output += "\n";
	}

	output += `export const pages = {`;

	for (const [name, { path: pm, search, hash }] of names) {
		const params = new Set<string>();
		let catchAllParam: string | undefined;

		const path =
			"/" +
			pm
				.slice(0, -9)
				.split("/")
				.filter((segment) => segment !== "index" && !segment.startsWith("_"))
				.map((segment) =>
					/* Split subsegments. E.g. hello-[name]-[surname] => hello-, [name], -, [surname]*/ segment
						.split(/(?=\[)|(?<=\])/g)
						.map((sub) => {
							if (sub.startsWith("[")) {
								let param = sub.slice(1, -1);
								if (param.startsWith("...")) {
									param = param.slice(3);
									catchAllParam = param;
									params.add(param);
									return "";
								} else {
									params.add(param);
									return "${" + param + "}";
								}
							}

							return normalizePathSegment(sub);
						})
						.join(""),
				)
				.filter(Boolean)
				.join("/");

		let arg = "";
		output += `\n\t${name}: `;
		let line: string;
		let decons = "";
		let type = "never";
		if (params.size || search || hash) {
			decons = params.size ? "{ " + [...params].join(", ") + " }" : "_params";
			type = "{ " + [...params].map((p) => p + ": string").join(", ") + " }";
			if (!params.size) {
				type += ` | undefined`;
			}

			if (search) {
				type += `, search: ${search}`;
			}

			if (hash) {
				type += `, hash: ${hash}`;
			}

			arg = `${decons}: ${type}`;

			if (catchAllParam) {
				line = `(${arg}) => _u\`${path}\` + ${catchAllParam}`;
			} else {
				line = `(${arg}) => _u\`${path}\``;
			}
		} else {
			line = `() => ${JSON.stringify(path)}`;
		}

		output += line;

		if (search) {
			output += ` + _q(search)`;
		}

		if (hash) {
			output += ` + _h(hash)`;
		}

		output += ",";
	}

	const union = [...names.values()]
		.filter((n) => n.search)
		.map((n) => n.search)
		.join(" | ");

	output += "\n};\n";

	output += "\ntype _SearchUnion = " + (union || "any") + ";\n";

	output += UTILS_SRC;

	if (!searchModule) {
		output += SEARCH_SRC;
	}

	writeFileSync("src/page-urls.ts", output);
}

const UTILS_SRC = `
function _u(parts: TemplateStringsArray, ...args: string[]): string {
	let result = "";
	for (let i = 0; i < parts.length; i++) {
		result += parts[i];
		if (i < args.length) {
			result += encodeURIComponent(args[i]);
		}
	}

	return result;
}

function _q(search: _SearchUnion): string {
	const result = _s(search);
	return result ? "?" + result : "";
}

function _h(hash: any): string {
	return hash ? "#" + hash : "";
}
`;

const SEARCH_SRC = `
function _s(search: _SearchUnion): string {
	return new URLSearchParams(search).toString();
}
`;
