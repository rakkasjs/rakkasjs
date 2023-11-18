require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
	extends: ["@cyco130/eslint-config/node"],
	parserOptions: { project: [__dirname + "/tsconfig.json"] },
	ignorePatterns: [
		"dist/**/*",
		"netlify/**/*",
		".vercel/**/*",
		".netlify/**/*",
	],
	rules: {
		"import/no-unresolved": [
			"error",
			{
				ignore: ["virtual:rakkasjs:api-routes"],
			},
		],
	},
};
