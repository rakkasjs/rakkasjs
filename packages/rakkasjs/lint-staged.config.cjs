module.exports = {
	"**/*.ts?(x)": [
		() => "tsc -p tsconfig.json --noEmit",
		"jest --findRelatedTests",
		"eslint --max-warnings=0",
		"prettier --write",
	],
};
