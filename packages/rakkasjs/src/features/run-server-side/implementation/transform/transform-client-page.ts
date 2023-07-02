import { NodePath, PluginItem } from "@babel/core";
import * as t from "@babel/types";
import { getAlreadyUnreferenced, removeUnreferenced } from "./transform-utils";

export function babelTransformClientSidePages(): PluginItem {
	return {
		visitor: {
			Program: {
				exit(program) {
					const alreadyUnreferenced = getAlreadyUnreferenced(program);
					let modified = false;

					program.traverse({
						ExportNamedDeclaration: {
							enter(path) {
								if (
									t.isFunctionDeclaration(path.node.declaration) &&
									SSR_EXPORTS.includes(path.node.declaration.id!.name)
								) {
									path.remove();
									modified = true;
								} else if (t.isVariableDeclaration(path.node.declaration)) {
									const declarations = path
										.get("declaration")
										.get("declarations") as NodePath<t.VariableDeclarator>[];

									for (const declaration of declarations) {
										if (
											t.isIdentifier(declaration.node.id) &&
											SSR_EXPORTS.includes(declaration.node.id.name)
										) {
											declaration.remove();
											modified = true;
										}
									}
								} else if (path.node.specifiers.length) {
									const specifiers = path.get("specifiers");

									for (const specifier of specifiers) {
										if (
											specifier.isExportSpecifier() &&
											t.isIdentifier(specifier.node.exported) &&
											SSR_EXPORTS.includes(specifier.node.exported.name)
										) {
											specifier.remove();
											modified = true;
										}
									}
								}
							},
						},
					});

					if (modified) {
						removeUnreferenced(program, alreadyUnreferenced);
					}
				},
			},
		},
	};
}

const SSR_EXPORTS = ["headers", "prerender", "action"];
