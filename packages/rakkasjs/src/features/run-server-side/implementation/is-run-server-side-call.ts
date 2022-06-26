import { NodePath } from "@babel/core";
import * as t from "@babel/types";

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

export function isRunServerSideCall(
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
