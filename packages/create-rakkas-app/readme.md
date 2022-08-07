# `create-rakkas-app`

Generate Rakkas application boilerplate

```sh
npx create-rakkas-app@latest my-rakkas-app
# or
pnpm create rakkas-app my-rakkas-app
# or
yarn create rakkas-app my-rakkas-app
```

## Options

```
$ create-rakkas-app [dir] [...options]

Options:
  -y, --skip-prompt  [boolean] Skip the prompt
  -f, --force        [boolean] Generate even if the directory is not empty
  -t, --typescript   [boolean] Use TypeScript for static typing (default: true)
  -p, --prettier     [boolean] Use Prettier for code formatting (default: true)
  -e, --eslint       [boolean] Use ESLint for linting JavaScript/TypeScript (default: true)
  -v, --vitest       [boolean] Use Vitest for unit testing (default: true)
  -d, --demo         [boolean] Generate demo todo app (default: true)
  -h, --help         Display this message
  -v, --version      Display version number

All features are enabled when using the -y option. Use, e.g., --no-typescript to opt out of a feature
```
