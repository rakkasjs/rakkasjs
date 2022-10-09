import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
	getAlreadyUnreferenced,
	isRunServerSideCall,
	removeUnreferenced,
} from "./transform-utils";

export function babelTransformClientSideHooks(
	moduleId: string,
	modifiedRef: { current: boolean },
): PluginItem {
	return {
		visitor: {
			Program: {
				exit(program) {
					let counter = 0;
					const alreadyUnreferenced = getAlreadyUnreferenced(program);

					program.traverse({
						CallExpression: {
							exit(call) {
								const nameRef: { name?: string } = {};
								if (!isRunServerSideCall(call, nameRef)) {
									return;
								}

								const argNo =
									nameRef.name === "runSSQ" ||
									nameRef.name === "runServerSideQuery"
										? 1
										: 0;

								let fn = call.get(`arguments.${argNo}`) as NodePath<
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

								const body = fn.get("body");
								const identifiers = new Set<string>();

								if (body.type === "Identifier") {
									const identifier = body.node as t.Identifier;
									const binding = fn.scope.parent.getBinding(identifier.name);

									if (
										program.scope
											.getBinding(identifier.name)
											?.referencePaths.includes(body)
									) {
										return;
									}

									if (
										binding?.path.get("id") === body ||
										binding?.referencePaths.includes(body)
									) {
										identifiers.add(identifier.name);
									}
								} else {
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
													identifiers.add(identifier.node.name);
												}
											},
										},
									});
								}

								modifiedRef.current = true;

								fn.replaceWith(
									t.arrayExpression([
										t.stringLiteral(moduleId),
										t.numericLiteral(counter++),
										t.arrayExpression(
											[...identifiers].map((id) => t.identifier(id)),
										),
									]),
								);
							},
						},
					});

					if (!modifiedRef.current) {
						return;
					}

					removeUnreferenced(program, alreadyUnreferenced);
				},
			},
		},
	};
}
