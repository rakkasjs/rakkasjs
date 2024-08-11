require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	ignorePatterns: ["node_modules", "dist", "**/*.cjs", "cli.js"],
	extends: ["@cyco130/eslint-config/react"],
	parserOptions: { tsconfigRootDir: __dirname, project: ["./tsconfig.json"] },
	rules: {
		"@typescript-eslint/no-floating-promises": "error",
	},
};
