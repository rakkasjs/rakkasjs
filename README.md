# Rakkas

---

**DO NOT USE IN PRODUCTION! This project is still in early exploratory phase. It's not even alpha quality.**

---

![](shared-assets/logo.png)

**Rakkas** aims to be a [React](https://reactjs.org) framework powered by [Vite](https://vitejs.dev), with a developer experience inspired by [Next.js](https://nextjs.org) and [Svelte Kit](https://kit.svelte.dev).


## TODO

```js
useReload({
	// Reload when one of the values in this array change
	deps: [params.slug],
	// Reload when window receives focus
	focus: true,
	// Reload when the internet connection is restored after a disconnection
	reconnect: true,
	// Set to true to reload immediately after hydration
	hydrate: false,
	// Set to i.e. 15_000 to reload every 15 seconds
	interval: false,
	// Set to true to reload even when the window has no focus
	background: false,
})
```

- Isomorphic fetch
- Middleware
- useReload hook
- Set up ESLint, prettier etc.
- Include react-helmet or equivalent functionality
- Investigate [vite-plugin-virtual](https://github.com/patak-js/vite-plugin-virtual)
- `rakkas build` command
- Prepare packages for publication
- Proper error handling
- Configurability
  - User vite configuration
  - Page and layout module extensions (i.e. .md, .mdx etc.)
- Project initializer
- Documentation
- Localized routing
- Customized routing
- Adapters for serverless environments

## Credits and license
- Initial concept and programming by [Fatih Aygün](https://github.com/cyco130)
- Logomark: “Flamenco” by [gzz from Noun Project](https://thenounproject.com/term/flamenco/111303/) (not affiliated). Used under [Creative Commons Attribution Generic license (CCBY)](https://creativecommons.org/licenses/by/2.0/).
