import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";
import { isRunServerSideCall } from "./is-run-server-side-call";

export function babelTransformClientSideHooks(
	moduleId: string,
	modifiedRef: { current: boolean },
): PluginItem {
	return {
		visitor: {
			Program: {
				exit(program) {
					let counter = 0;
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
								if (!isRunServerSideCall(call)) {
									return;
								}

								let fn = call.get("arguments.0") as NodePath<
									t.ArrowFunctionExpression | t.FunctionExpression
								>;

								if (
									!t.isArrowFunctionExpression(fn) &&
									!t.isFunctionExpression(fn)
								) {
									fn = fn.replaceWith(
										t.arrowFunctionExpression(
											[t.restElement(t.identifier("$runServerSideArgs$"))],
											t.callExpression(fn.node, [
												t.spreadElement(t.identifier("$runServerSideArgs$")),
											]),
										),
									)[0];
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

								modifiedRef.current = true;

								fn.replaceWith(
									t.arrayExpression([
										t.stringLiteral(moduleId),
										t.numericLiteral(counter++),
										t.arrayExpression(
											[...identifiers].map((id) => t.identifier(id.node.name)),
										),
									]),
								);
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
