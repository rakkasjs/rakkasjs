# @rakkasjs/eslint-config-js

This is a reusable ESLint configuration for vanilla JavaScript [Rakkas](https://rakkasjs.org) applications. Although it is mainly intended for Rakkas applications, currently there is nothing Rakkas specific in it, it can be used for any React SSR project.

## Usage

Install with `npm install -D @rakkasjs/eslint-config-js` and create a `.eslintrc.cjs` file with the following content:

```js
require("@rakkasjs/eslint-config-js/patch");

module.exports = {
	root: true,
	extends: ["@rakkasjs/eslint-config-js"],
};
```

It uses the [rushstack ESLint patch](https://www.npmjs.com/package/@rushstack/eslint-patch) so you don't have to install the ESLint plugins used by it.
