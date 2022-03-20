import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";

export function babelTransformServerSideHooks(moduleId: string): PluginItem {
	const newNodes = new Set<NodePath>();
	const removedPaths: NodePath[] = [];
	const removedNodes: t.Expression[] = [];
	let counter = 0;

	return {
		visitor: {
			// Hoist the closure
			Expression: {
				enter(arg, state) {
					if (
						arg.parentPath.isCallExpression() &&
						arg.node === arg.parentPath.node.arguments[0] &&
						!t.isNullLiteral(arg.node)
					) {
						const callee = arg.parentPath.node.callee;
						if (!t.isIdentifier(callee)) return;
						const binding = arg.parentPath.scope.getBinding(callee.name);
						if (
							binding &&
							binding.path.isImportSpecifier() &&
							t.isIdentifier(binding.path.node.imported) &&
							[
								"useServerSideQuery",
								"useServerSideMutation",
								"useSSQ",
								"useSSM",
							].includes(binding.path.node.imported.name) &&
							binding.path.parentPath.isImportDeclaration() &&
							binding.path.parentPath.node.source.value === "rakkasjs" &&
							!newNodes.has(arg)
						) {
							newNodes.add(arg);
							arg.node.extra = arg.node.extra || {};
							arg.node.extra.hoistMe = true;
							state._runServerSide = new Set<string>();
							state._parentScope = arg.parentPath.scope;
						}
					}
				},

				exit(arg, state) {
					if (arg.node.extra?.hoistMe) {
						removedPaths.push(arg);
						removedNodes.push(arg.node);

						const closure = Array.from(state._runServerSide as Set<string>);

						const replacement = t.arrayExpression([
							t.stringLiteral(moduleId),
							t.numericLiteral(counter),
							t.objectExpression(
								closure.map((id) =>
									t.objectProperty(
										t.identifier(id),
										t.identifier(id),
										false,
										true,
									),
								),
							),
							t.memberExpression(
								t.identifier("$runServerSide$"),
								t.numericLiteral(counter++),
								true,
							),
						]);

						if (
							t.isArrowFunctionExpression(arg.node) ||
							t.isFunctionExpression(arg.node)
						) {
							arg.node.async = true;
							arg.node.params.unshift(t.identifier("$runServerSideClosure$"));

							if (t.isExpression(arg.node.body)) {
								arg.node.body = t.blockStatement([
									t.returnStatement(arg.node.body),
								]);
							}

							arg.node.body.body.unshift(
								t.variableDeclaration("let", [
									t.variableDeclarator(
										t.objectPattern(
											closure.map((name) =>
												t.objectProperty(
													t.identifier(name),
													t.identifier(name),
													false,
													true,
												),
											),
										),
										t.identifier("$runServerSideClosure$"),
									),
								]),
							);
						}

						arg.replaceWith(replacement);

						delete state._runServerSide;
						delete state._parentScope;
					}
				},
			},

			Identifier: {
				enter(identifier, state) {
					if (state._runServerSide) {
						if (
							!state._parentScope.bindings[
								identifier.node.name
							]?.referencePaths.includes(identifier)
						) {
							return;
						}

						state._runServerSide.add(identifier.node.name);
					}
				},
			},

			Program: {
				exit(program) {
					if (removedNodes.length) {
						program.node.body.push(
							t.exportNamedDeclaration(
								t.variableDeclaration("const", [
									t.variableDeclarator(
										t.identifier("$runServerSide$"),
										t.arrayExpression(removedNodes),
									),
								]),
							),
						);
					}
				},
			},
		},
	};
}
