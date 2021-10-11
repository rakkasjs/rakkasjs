# Rakkas Styled Components Example

## Manual setup
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