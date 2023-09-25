require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
	extends: ["@cyco130/eslint-config/react"],
	parserOptions: { tsconfigRootDir: __dirname, project: ["./tsconfig.json"] },
	rules: {
		"import/no-unresolved": [
			"error",
			{
				ignore: ["^virtual:"],
			},
		],
		"@typescript-eslint/no-floating-promises": "error",
	},
};
