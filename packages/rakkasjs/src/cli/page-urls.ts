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

	let hasSearch = false;

	for (const path of pageModules) {
		const sourceFile = program.getSourceFile("src/routes/" + path);
		if (!sourceFile) {
			console.warn(`Failed to parse ${path}`);
			continue;
		}

		const checker = program.getTypeChecker();
		const sourceFileSymbol = checker.getSymbolAtLocation(sourceFile);
		if (!sourceFileSymbol) {
			console.warn(`Failed to get symbol of ${path}`);
			continue;
		}

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

		if (search) {
			hasSearch = true;
		}

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
	let output =
		`/* eslint-disable */\n` + `// This file is generated automatically\n\n`;

	if (hasSearch) {
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

	let urlEscapeUsed = false;
	let hashSerializerUsed = false;

	for (const [name, { path: pm, search, hash }] of names) {
		const params = new Set<string>();
		let catchAllParam: string | undefined;

		const path =
			"/" +
			pm
				.replace(/\\|--/g, "/")
				.slice(0, -9)
				.split("/")
				.filter(
					(s) =>
						s[0] !== "_" && s !== "index" && !(s[0] === "(" && s.endsWith(")")),
				)
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
			const deconsBits = [...params];
			type = "{ " + [...params].map((p) => p + ": string").join(", ");

			if (hash) {
				deconsBits.push("hash");
				if (params.size) type += ", ";
				type += `hash: ${hash}`;
			}

			type += " }";

			if (search) {
				deconsBits.push("..._search");
				type += ` & ${search}`;
			}

			decons = `{ ${deconsBits.join(", ")} }`;

			arg = `${decons}: ${type}`;

			if (params.size) {
				if (catchAllParam) {
					line = `(${arg}) => _u\`${path}\` + ${catchAllParam}`;
				} else {
					line = `(${arg}) => _u\`${path}\``;
				}

				urlEscapeUsed = true;
			} else {
				line = `(${arg}) => ${JSON.stringify(path)}`;
			}
		} else {
			line = `(${arg}) => ${JSON.stringify(path)}`;
		}

		output += line;

		if (search) {
			output += ` + _q(_search)`;
		}

		if (hash) {
			output += ` + _h(hash)`;
			hashSerializerUsed = true;
		}

		output += ",";
	}

	output += "\n};\n";

	if (urlEscapeUsed) {
		output += URL_ESCAPE_SRC;
	}

	if (hasSearch) {
		const union = [...names.values()]
			.filter((n) => n.search)
			.map((n) => n.search)
			.join(" | ");
		output += "\ntype _SearchUnion = " + (union || "any") + ";\n";

		if (!searchModule) {
			output += SEARCH_SERIALIZER_SRC;
		}

		output += SEARCH_WRAPPER_SRC;
	}

	if (hashSerializerUsed) {
		output += HASH_SERIALIZER_SRC;
	}

	writeFileSync("src/page-urls.ts", output);
}

const URL_ESCAPE_SRC = `
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
`;

const SEARCH_WRAPPER_SRC = `
function _q(search: _SearchUnion): string {
	const result = _s(search);
	return result ? "?" + result : "";
}
`;

const HASH_SERIALIZER_SRC = `
function _h(hash: any): string {
	return hash ? "#" + hash : "";
}
`;

const SEARCH_SERIALIZER_SRC = `
function _s(search: _SearchUnion): string {
	return new URLSearchParams(search).toString();
}
`;
