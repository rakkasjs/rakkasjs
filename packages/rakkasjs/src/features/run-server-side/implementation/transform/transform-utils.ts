import { NodePath } from "@babel/core";
import * as t from "@babel/types";

const RUN_SERVER_SIDE_FUNCTION_NAMES = [
	"useServerSideQuery",
	"useServerSideMutation",
	"useServerSentEvents",
	"useSSQ",
	"useSSM",
	"useSSE",
	"runServerSideQuery",
	"runServerSideMutation",
	"runSSQ",
	"runSSM",
	"useFormMutation",
];

export function isRunServerSideCall(
	expr: NodePath,
	nameRef: { name?: string },
): expr is NodePath<t.CallExpression> {
	if (!expr.isCallExpression()) {
		return false;
	}

	const callee = expr.node.callee;
	if (t.isIdentifier(callee)) {
		const binding = expr.parentPath.scope.getBinding(callee.name);
		nameRef.name = (binding?.path.node as any)?.imported?.name;
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

		nameRef.name = (callee.property as any)?.name;

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

export function getAlreadyUnreferenced(program: NodePath<t.Program>) {
	const alreadyUnreferenced = new Set<string>();

	for (const [name, binding] of Object.entries(program.scope.bindings)) {
		if (!binding.referenced) {
			alreadyUnreferenced.add(name);
		}
	}

	return alreadyUnreferenced;
}

export function removeUnreferenced(
	program: NodePath<t.Program>,
	alreadyUnreferenced: Set<string>,
) {
	for (;;) {
		program.scope.crawl();
		let removed = false;
		for (const [name, binding] of Object.entries(program.scope.bindings)) {
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
}

export function extractUniqueId(optionsPath: NodePath): string | undefined {
	if (!optionsPath.isObjectExpression()) {
		throw optionsPath.buildCodeFrameError(
			"The `options` argument must be a literal object",
		);
	}

	const stableIdPath = optionsPath.get("properties").find((prop) =>
		(prop.get("key") as NodePath<t.Identifier>)?.isIdentifier({
			name: "uniqueId",
		}),
	);

	if (!stableIdPath) {
		return;
	}

	const value: NodePath = stableIdPath.get("value") as NodePath;
	if (!value.isStringLiteral()) {
		throw value.buildCodeFrameError(
			"The `uniqueId` property of the `options` argument must be a string literal",
		);
	}

	return value.node.value;
}
