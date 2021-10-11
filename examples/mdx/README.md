# Rakkas MDX Example

This is an example [`MDX`](https://mdxjs.com/) setup for Rakkas which allows you to create your pages with MDX.

You can clone and try it with:

```sh
npx degit rakkasjs/rakkasjs/examples/mdx
```

## Manual setup procedure
- Install `@mdx-js/react` and `@mdx-js/mdx` as production dependencies.
- Install `vite-plugin-mdx` as a development dependency.
- Setup your `rakkas.config.js` like this:
	```js
	import mdx from "vite-plugin-mdx";

	export default {
		pageExtensions: ["tsx", "jsx", "mdx"],
		vite: { plugins: [mdx()] },
	};
	```