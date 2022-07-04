require("@cyco130/eslint-config/patch");

module.exports = {
	root: true,
	extends: ["@cyco130/eslint-config/react"],
	parserOptions: { tsconfigRootDir: __dirname },
	settings: {
		"import/resolver": {
			typescript: {
				project: [__dirname + "/tsconfig.json"],
			},
		},
	},
};
