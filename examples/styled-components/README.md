# Rakkas Styled Components Example

This is an example [`styled-components`](https://styled-components.com/) setup for Rakkas with full SSR support. Other popular CSS-in-JS solutions (like [`emotion`](https://emotion.sh/)) have very similar, and usually simpler setups for SSR.

[Try it in your browser](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/main/examples/styled-components?file=src%2Fpages%2Fpage.tsx)

...or on your computer:

```sh
npx degit rakkasjs/rakkasjs/examples/styled-components
```

## Manual setup procedure
- Install `styled-components` as a production dependency.
- Install `@types/styled-components` (if using TypeScript) and `babel-plugin-styled-components` as development dependencies.
- Set up your `server.ts` (or `.js`) like this:
	```ts
	import { ServePageHook } from "rakkasjs";
	import { ServerStyleSheet } from "styled-components";

	export const servePage: ServePageHook = (request, renderPage) => {
		const sheet = new ServerStyleSheet();

		return renderPage(request, undefined, {
			wrap: (page) => sheet.collectStyles(page),
			getHeadHtml: () => sheet.getStyleTags(),
		});
	};
	```
- Add `"babel-plugin-styled-components"` to `babel.plugins` in your `rakkas.config.ts` (or `.js`) file.