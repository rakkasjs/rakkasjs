require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
	extends: ["@cyco130/eslint-config/node"],
	parserOptions: { tsconfigRootDir: __dirname },
	settings: {
		"import/resolver": {
			typescript: {
				project: [__dirname + "/tsconfig.json"],
			},
		},
	},
};
