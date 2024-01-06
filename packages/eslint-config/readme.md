# @rakkasjs/eslint-config

This is a reusable ESLint configuration for TypeScript [Rakkas](https://rakkasjs.org) applications. Although it is mainly intended for Rakkas applications, currently there is nothing Rakkas specific in it, it can be used for any React SSR project.

## Usage

Install with `npm install -D @rakkasjs/eslint-config` and create a `.eslintrc.cjs` file with the following content:

```js
require("@rakkasjs/eslint-config/patch");

module.exports = {
  root: true,
  ignorePatterns: ["node_modules", "dist", "**/*.cjs"],
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
```

It uses the [rushstack ESLint patch](https://www.npmjs.com/package/@rushstack/eslint-patch) so you don't have to install the ESLint plugins used by it.
