import { NodePath, type PluginItem } from "@babel/core";
import * as t from "@babel/types";

/**
 * Remove exports from a module along with declarations and imports only used
 * by those exports.
 *
 * @param exportNames Names of exports to remove or keep
 * @param mode Whether to remove or keep the exports
 */
export function babelRemoveExports(
	mode: "remove" | "keep",
	exportNames: string[],
): PluginItem {
	const nameSet = new Set(exportNames);
	function shouldRemove(name: string) {
		return mode === "remove" ? nameSet.has(name) : !nameSet.has(name);
	}

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
									shouldRemove(path.node.declaration.id!.name)
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
											shouldRemove(declaration.node.id.name)
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
											shouldRemove(specifier.node.exported.name)
										) {
											specifier.remove();
											modified = true;
										}
									}
								}
							},
						},

						ExportDefaultDeclaration: {
							enter(path) {
								if (shouldRemove("default")) {
									path.remove();
									modified = true;
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

function getAlreadyUnreferenced(program: NodePath<t.Program>) {
	const alreadyUnreferenced = new Set<string>();

	for (const [name, binding] of Object.entries(program.scope.bindings)) {
		if (!binding.referenced) {
			alreadyUnreferenced.add(name);
		}
	}

	return alreadyUnreferenced;
}

function removeUnreferenced(
	program: NodePath<t.Program>,
	alreadyUnreferenced: Set<string>,
) {
	for (;;) {
		program.scope.crawl();

		let removed = false;

		for (const [name, binding] of Object.entries(program.scope.bindings)) {
			if (alreadyUnreferenced.has(name)) {
				continue;
			}

			if (binding.referenced) {
				if (binding.referencePaths.every(isTopLevelMemberAssignment)) {
					for (const path of binding.referencePaths) {
						path.parentPath!.parentPath!.remove();
					}
					removed = true;
				} else {
					continue;
				}
			}

			const parent = binding.path.parentPath;
			if (
				parent?.isImportDeclaration() &&
				parent.node.specifiers.length === 1
			) {
				parent.remove();
			} else {
				binding.path.remove();
			}

			removed = true;
		}

		if (!removed) break;
	}
}

function isTopLevelMemberAssignment(path: NodePath) {
	return (
		path.isIdentifier() &&
		path.key === "object" &&
		path.parentPath.isMemberExpression() &&
		path.parentPath.key === "left" &&
		path.parentPath.parentPath.isAssignmentExpression() &&
		path.parentPath.parentPath.parentPath.isExpressionStatement() &&
		path.parentPath.parentPath.parentPath.parentPath.isProgram()
	);
}
