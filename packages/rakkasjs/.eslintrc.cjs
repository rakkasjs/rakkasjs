require("@cyco130/eslint-config/patch");

module.exports = {
	extends: ["@cyco130/eslint-config/node"],
	parserOptions: { tsconfigRootDir: __dirname },
	rules: {
		"import/no-unresolved": [
			"error",
			{
				ignore: [
					"virtual:rakkasjs:api-routes",
					"virtual:rakkasjs:server-page-routes",
					"virtual:rakkasjs:client-page-routes",
					"virtual:rakkasjs:client-manifest",
					"virtual:rakkasjs:run-server-side:manifest",
				],
			},
		],
	},
};
