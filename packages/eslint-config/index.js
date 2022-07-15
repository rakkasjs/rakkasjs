module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:react/recommended",
		"plugin:ssr-friendly/recommended",
		"plugin:css-modules/recommended",
		"prettier",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: [
		"@typescript-eslint",
		"css-modules",
		"import",
		"no-only-tests",
		"react",
		"react-hooks",
		"ssr-friendly",
	],
	settings: {
		react: {
			version: "18",
		},
		"import/parsers": {
			"@typescript-eslint/parser": [".ts", ".tsx"],
		},
		"import/resolver": {
			typescript: {
				alwaysTryTypes: true,
			},
		},
	},
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"no-console": ["error", { allow: ["warn", "error"] }],
		"no-only-tests/no-only-tests": "error",
		"no-mixed-spaces-and-tabs": "off",
		"no-warning-comments": [
			"error",
			{ terms: ["fixme"], location: "anywhere" },
		],
		"react/prop-types": "off",
		"react/react-in-jsx-scope": "off",
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": "error",
	},
};
