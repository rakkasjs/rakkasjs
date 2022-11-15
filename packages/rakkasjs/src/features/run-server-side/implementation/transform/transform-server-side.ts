import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
	getAlreadyUnreferenced,
	isRunServerSideCall,
	removeUnreferenced,
} from "./transform-utils";

export function babelTransformServerSideHooks(moduleId: string): PluginItem {
	let counter = 0;

	return {
		visitor: {
			Program: {
				exit(program) {
					const alreadyUnreferenced = getAlreadyUnreferenced(program);
					const hoisted: t.Expression[] = [];

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

								let body = fn.get("body");
								const identifiers = new Set<string>();

								if (body.type !== "BlockStatement") {
									body = body.replaceWith(
										t.blockStatement([
											t.returnStatement(body.node as t.Expression),
										]),
									)[0];

									fn.scope.parent.crawl();
								}

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

								const ids = [...identifiers];

								const replacement = t.arrayExpression([
									t.stringLiteral(moduleId),
									t.numericLiteral(counter),
									t.arrayExpression(ids.map((id) => t.identifier(id))),
									t.memberExpression(
										t.identifier("$runServerSide$"),
										t.numericLiteral(counter++),
										true,
									),
								]);

								if (
									t.isArrowFunctionExpression(fn.node) ||
									t.isFunctionExpression(fn.node)
								) {
									fn.node.async = true;
									fn.node.params.unshift(
										t.identifier("$runServerSideClosure$"),
									);

									if (t.isExpression(fn.node.body)) {
										fn.node.body = t.blockStatement([
											t.returnStatement(fn.node.body),
										]);
									}

									fn.node.body.body.unshift(
										t.variableDeclaration("let", [
											t.variableDeclarator(
												t.arrayPattern(ids.map((id) => t.identifier(id))),
												t.identifier("$runServerSideClosure$"),
											),
										]),
									);
								}

								hoisted.push(fn.node);

								fn.replaceWith(replacement);

								if (
									nameRef.name === "runSSM" ||
									nameRef.name === "runServerSideMutation"
								) {
									call.parentPath.replaceWith(t.nullLiteral());
									return;
								}
							},
						},
					});

					if (hoisted.length) {
						program.node.body.push(
							t.exportNamedDeclaration(
								t.variableDeclaration("const", [
									t.variableDeclarator(
										t.identifier("$runServerSide$"),
										t.arrayExpression(hoisted),
									),
								]),
							),
						);
					}

					removeUnreferenced(program, alreadyUnreferenced);
				},
			},
		},
	};
}
