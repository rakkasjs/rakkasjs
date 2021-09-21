import { PluginItem } from "@babel/core";

export function babelPluginStripLoadFunction(): PluginItem {
	return {
		visitor: {
			ObjectExpression(path) {
				if (
					path.parent.type === "CallExpression" &&
					path.parent.arguments[0] === path.node &&
					path.parent.callee.type === "Identifier" &&
					(path.parent.callee.name === "definePage" ||
						path.parent.callee.name === "defineLayout")
				) {
					path.node.properties = path.node.properties.filter(
						(x) =>
							x.type === "SpreadElement" ||
							x.key.type !== "Identifier" ||
							(x.key.name !== "load" && x.key.name !== "getCacheKey"),
					);
				}
			},
		},
	};
}
