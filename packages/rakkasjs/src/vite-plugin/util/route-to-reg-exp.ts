export function routeToRegExp(route: string): RegExp {
	return new RegExp(
		"^" +
			route
				.split("/")
				.filter((x) => x !== "index" && !x.startsWith("_"))
				.join("/")
				.replace(
					/\[[a-zA-Z_][a-zA-Z0-9_]*]/g,
					(name) => `(?<${name.slice(1, -1)}>[^/]*)`,
				) +
			"\\/?$",
	);
}
