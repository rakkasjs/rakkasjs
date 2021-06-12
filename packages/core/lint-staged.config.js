module.exports = {
	"**/*.ts?(x)": [
		() => "tsc -p tsconfig.json --noEmit",
		"jest --coverage --findRelatedTests",
		"eslint --max-warnings=0",
		"prettier --write",
	],
};
