require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	extends: ["@cyco130/eslint-config/node"],
	parserOptions: { tsconfigRootDir: __dirname },
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
