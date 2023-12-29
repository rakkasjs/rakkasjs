require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
	extends: ["@cyco130/eslint-config/node"],
	parserOptions: { project: [__dirname + "/tsconfig.json"] },
	rules: {
		"import/no-unresolved": [
			"error",
			{
				ignore: ["virtual:rakkasjs:api-routes"],
			},
		],
	},
};
