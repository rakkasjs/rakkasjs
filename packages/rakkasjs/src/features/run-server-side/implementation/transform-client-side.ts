import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";

export function babelTransformClientSideHooks(
	moduleId: string,
	modifiedRef: { current: boolean },
): PluginItem {
	return {
		visitor: {
			Program: {
				exit(program) {
					let counter = 0;
					const removed = new Set<NodePath>();
					const alreadyUnreferenced = new Set<string>();

					for (const [name, binding] of Object.entries(
						program.scope.bindings,
					)) {
						if (!binding.referenced) {
							alreadyUnreferenced.add(name);
						}
					}

					program.traverse({
						CallExpression: {
							exit(call) {
								if (isRunServerSideCall(call)) {
									const fn = call.get("arguments.0") as NodePath<
										t.ArrowFunctionExpression | t.FunctionExpression
									>;

									if (
										!t.isArrowFunctionExpression(fn) &&
										!t.isFunctionExpression(fn)
									) {
										return;
									}

									const body = fn.get("body") as NodePath<t.BlockStatement>;
									const identifiers = new Set<NodePath<t.Identifier>>();

									body.traverse({
										Identifier: {
											exit(identifier) {
												const binding = fn.scope.parent.getBinding(
													identifier.node.name,
												);

												if (
													program.scope
														.getBinding(identifier.node.name)
														?.referencePaths.includes(identifier)
												) {
													return;
												}

												if (
													binding?.path.get("id") === identifier ||
													binding?.referencePaths.includes(identifier)
												) {
													identifiers.add(identifier);
												}
											},
										},
									});

									removed.add(call);
									modifiedRef.current = true;

									fn.replaceWith(
										t.arrayExpression([
											t.stringLiteral(moduleId),
											t.numericLiteral(counter++),
											t.arrayExpression(
												[...identifiers].map((id) =>
													t.identifier(id.node.name),
												),
											),
										]),
									);
								}
							},
						},
					});

					if (!modifiedRef.current) {
						return;
					}

					for (;;) {
						program.scope.crawl();
						let removed = false;
						for (const [name, binding] of Object.entries(
							program.scope.bindings,
						)) {
							if (binding.referenced || alreadyUnreferenced.has(name)) {
								continue;
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
				},
			},
		},
	};
}

const RUN_SERVER_SIDE_FUNCTION_NAMES = [
	"useServerSideQuery",
	"useServerSideMutation",
	"useSSQ",
	"useSSM",
	"runServerSideQuery",
	"runServerSideMutation",
	"runSSQ",
	"runSSM",
];

function isRunServerSideCall(
	expr: NodePath,
): expr is NodePath<t.CallExpression> {
	if (!expr.isCallExpression()) {
		return false;
	}

	const callee = expr.node.callee;
	if (t.isIdentifier(callee)) {
		const binding = expr.parentPath.scope.getBinding(callee.name);
		return !!(
			binding &&
			binding.path.isImportSpecifier() &&
			t.isIdentifier(binding.path.node.imported) &&
			RUN_SERVER_SIDE_FUNCTION_NAMES.includes(
				binding.path.node.imported.name,
			) &&
			binding.path.parentPath.isImportDeclaration() &&
			binding.path.parentPath.node.source.value === "rakkasjs"
		);
	} else if (t.isMemberExpression(callee)) {
		if (!t.isIdentifier(callee.object)) {
			return false;
		}

		const binding = expr.parentPath.scope.getBinding(callee.object.name);

		return !!(
			binding &&
			(binding.path.isImportDefaultSpecifier() ||
				binding.path.isImportNamespaceSpecifier()) &&
			binding.path.parentPath.isImportDeclaration() &&
			binding.path.parentPath.node.source.value === "rakkasjs" &&
			t.isIdentifier(callee.property) &&
			RUN_SERVER_SIDE_FUNCTION_NAMES.includes(callee.property.name)
		);
	}

	return false;
}
