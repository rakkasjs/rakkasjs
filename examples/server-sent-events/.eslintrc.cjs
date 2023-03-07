require("@rakkasjs/eslint-config/patch");

module.exports = {
	root: true,
	extends: ["@rakkasjs"],
	parserOptions: { tsconfigRootDir: __dirname },
	settings: {
		"import/resolver": {
			typescript: {
				project: [__dirname + "/tsconfig.json"],
			},
		},
	},
};
