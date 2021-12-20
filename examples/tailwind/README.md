# Rakkas Tailwind CSS Example

This is an example [`Tailwind CSS`](https://tailwindcss.com/) setup for Rakkas.

[Try it in your browser](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/v0.4.0/examples/tailwind?file=src%2Fpages%2Fpage.tsx)

You can clone and try it with:

```sh
npx degit rakkasjs/rakkasjs/examples/tailwind
```

## Manual setup procedure
- Install `tailwindcss`, `postcss`, and `autoprefixer` as development dependencies.
- Follow the instructions on the [Tailwind CSS documentation](https://tailwindcss.com/docs/installation) to `create postcss.config.js` and `tailwind.config.js` configuration files.
- Import `tailwindcss/tailwind.css` from your outermost layout or `client.js`.
- Make sure to [set the `purge` option correctly](https://tailwindcss.com/docs/optimizing-for-production#removing-unused-css) (`["./src/**/*.tsx", "./src/**/*.jsx"]` should be OK for most cases)