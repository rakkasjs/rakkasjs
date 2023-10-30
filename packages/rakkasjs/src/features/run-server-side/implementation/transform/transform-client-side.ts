import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
	extractUniqueId,
	getAlreadyUnreferenced,
	isRunServerSideCall,
	removeUnreferenced,
} from "./transform-utils";

export function babelTransformClientSideHooks(args: {
	moduleId: string;
	/** Set if any changes are made */
	modified: boolean;
	/** Only exists when not in dev server */
	buildId?: string;
	/** Filled with custom unique IDs */
	uniqueIds?: Array<string | undefined>;
}): PluginItem {
	const { moduleId, uniqueIds } = args;

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

								const fn = call.get(`arguments.${argNo}`) as NodePath<
									t.ArrowFunctionExpression | t.FunctionExpression
								>;

								let uniqueId: string | undefined;
								if (uniqueIds) {
									const optionsArgNo = argNo + 1;

									const options = call.get(`arguments.${optionsArgNo}`) as
										| NodePath
										| undefined;

									uniqueId = options && extractUniqueId(options);
									if (uniqueId) {
										uniqueIds[counter] = uniqueId;
									}
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

								args.modified = true;
								const callSiteId = uniqueId
									? "id/" + encodeURIComponent(uniqueId)
									: moduleId + "/" + counter++;

								fn.replaceWith(
									t.arrayExpression([
										t.stringLiteral(callSiteId),
										t.arrayExpression(
											[...identifiers].map((id) => t.identifier(id)),
										),
									]),
								);
							},
						},
					});

					if (!args.modified) {
						return;
					}

					removeUnreferenced(program, alreadyUnreferenced);
				},
			},
		},
	};
}
