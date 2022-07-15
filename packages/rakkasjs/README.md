# ![Rakkas](logo.png)

<div align="center">

Lightning fast [Next.js](https://nextjs.org) alternative powered by [Vite](https://vitejs.dev)

[![Build Status](https://app.travis-ci.com/rakkasjs/rakkasjs.svg?branch=main)](https://app.travis-ci.com/rakkasjs/rakkasjs)
![npm type definitions](https://img.shields.io/npm/types/rakkasjs)
[![MIT license](https://img.shields.io/npm/l/rakkasjs)](https://github.com/rakkasjs/rakkasjs/blob/main/LICENSE)
[![React](https://badges.aleen42.com/src/react.svg)](https://reactjs.org)
[![Vite](https://badges.aleen42.com/src/vitejs.svg)](https://vitejs.dev)
[![Tweet about Rakkas](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Frakkasjs%2Frakkasjs)](https://twitter.com/intent/tweet?text=I%20gave%20%23RakkasJS%20a%20try!&url=https%3A%2F%2Fgithub.com%2Frakkasjs%2Frakkasjs)

[Read the guide](https://rakkasjs.org/guide) | [Try it in the browser](https://stackblitz.com/edit/rakkas-demo-ts?file=src%2Fpages%2Fpage.tsx)

</div>

---

## What is Rakkas?

**Rakkas** is a web framework powered by [React](https://reactjs.org) and [Vite](https://vitejs.dev) that aims to have a developer experience similar to [Next.js](https://nextjs.org). Many of its features are also inspired by [Svelte Kit](https://kit.svelte.dev). Important features are:

- ⚡&nbsp; Lightning fast development
- 🖥️&nbsp; Hassle free server-side rendering
- 🚀&nbsp; Support for deploying on serverless environments
- 📄&nbsp; Static site generation
- 🇺🇳&nbsp; Localizable URLs
- 🔀&nbsp; Rendering modes (pre-rendering, server-side, client-side)
- ☸️&nbsp; SPA-style client-side navigation
- 📁&nbsp; Intuitive file system-based routing
- ⬇️&nbsp; Simple but effective data fetching system
- ⚙️&nbsp; API routes to build and organize your backend

See the [feature comparison with Next.js](https://rakkasjs.org/guide/feature-comparison) for other supported and planned features.

## Is Rakkas right for you?

- Although many features have been implemented, Rakkas is still in development. There _will_ be breaking changes until we hit 1.0. As such, it's **not yet ready for production use**. If you need a stable React framework try Next.js or [Gatsby](https://www.gatsbyjs.com/).
- Rakkas doesn't aim compatibility with Next.js. Check out [Vitext](https://github.com/Aslemammad/vitext) if you want to port a Next.js application to Vite.
- Rakkas is somewhat opinionated. If you need more flexibility try [vite-ssr-plugin](https://vite-plugin-ssr.com/).

## Getting started

> 🚀 You can now **try Rakkas online, right in your browser**!
>
> - [Rakkas **TypeScript** demo app on StackBlitz](https://stackblitz.com/edit/rakkas-demo-ts?file=src%2Fpages%2Fpage.tsx)
> - [Rakkas **JavaScript** demo app on StackBlitz](https://stackblitz.com/edit/rakkas-demo?file=src%2Fpages%2Fpage.jsx)

The easiest way to try Rakkas out on your computer is to use the project initializer:

```bash
# Create the project directory
mkdir my-app && cd my-app
# Scaffold the demo app: Follow the prompts for the rest
npx create-rakkas-app@latest
```

`create-rakkas-app` project initializer comes with many features, all off which are optional but we strongly recommend enabling TypeScript and the generation of a demo project on your first try because self-documenting type definitions allow for a smoother learning curve and the demo project source code comes with plenty of comments. You may not need this guide!

> 👷 If you prefer a manual setup, you can install `rakkasjs`, `react`, `react-dom`, and `react-helmet-async` as production dependencies, and `@rakkasjs/cli` as a dev dependency:
>
> ```bash
> npm install --save rakkasjs react react-dom react-helmet-async
> npm install --save-dev @rakkasjs/cli
> ```
>
> Then you can start a development server on `localhost:3000` with `npx rakkas dev`, build with `npx rakkas build`, and launch with `node dist/server`.

## Credits

- [Fatih Aygün](https://github.com/cyco130), under [MIT License](https://opensource.org/licenses/MIT).
- Logomark: “Flamenco” by [gzz from Noun Project](https://thenounproject.com/term/flamenco/111303) (not affiliated) under [Creative Commons Attribution Generic license (CCBY)](https://creativecommons.org/licenses/by/2.0/)
- Parts of the CLI are based on [Vite CLI](https://github.com/vitejs/vite/tree/main/packages/vite) by Yuxi (Evan) You (not affiliated) and Vite contributors (not affiliated), used under [MIT License](./vite-license.md).
- Published npm package bundles the following software:
  - [`react-helmet-async`](https://github.com/staylor/react-helmet-async) by Scott Taylor (not affiliated), used under [Apache 2.0 license](./react-helmet-async-license.txt).
  - [`@brillout/json-s](https://github.com/brillout/json-s) by Romuald Brillout (not affiliated), used under [MIT License](./json-s-license.md).

## Version history

## 0.5.0

- Serverless support (Vercel, Netlify, Cloudflare Workers)
- Improved client-side navigation
- Improved SSRRomuald Brillout
- Partial pre-rendering
- Client-only pages
- Localizable URLs
- `Cache-control` header setting

## 0.4.0

- Static site generation
- Switch to React automatic JSX runtime
- Integration examples (Apollo GraphQL, Styled Components, MDX, Tailwind CSS)
- More options in the project generator
- Lots of minor features and fixes
- Much-expanded documentation
