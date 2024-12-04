# ![Rakkas](logo.png)

<div align="center">

Bleeding-edge React framework powered by [Vite](https://vitejs.dev)

[![Build Status](https://app.travis-ci.com/rakkasjs/rakkasjs.svg?branch=main)](https://app.travis-ci.com/rakkasjs/rakkasjs)
![npm type definitions](https://img.shields.io/npm/types/rakkasjs)
[![MIT license](https://img.shields.io/npm/l/rakkasjs)](https://github.com/rakkasjs/rakkasjs/blob/main/LICENSE)
[![React](https://badges.aleen42.com/src/react.svg)](https://reactjs.org)
[![Vite](https://badges.aleen42.com/src/vitejs.svg)](https://vitejs.dev)
[![Tweet about Rakkas](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Frakkasjs%2Frakkasjs)](https://twitter.com/intent/tweet?text=I%20gave%20%23RakkasJS%20a%20try!&url=https%3A%2F%2Fgithub.com%2Frakkasjs%2Frakkasjs)

[Read the guide](https://rakkasjs.org/guide) | [Try on CodeSandbox](https://codesandbox.io/s/github/rakkasjs/rakkasjs/tree/main/examples/todo?file=/src/routes/index.page.tsx) | [Try on StackBlitz](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/main/examples/todo?file=src%2Froutes%2Findex.page.tsx)

</div>

---

**Rakkas** is a bleeding-edge full-stack [React](https://reactjs.org) framework powered by [Vite](https://vitejs.dev). You can consider it an up-and-coming alternative to [Next.js](https://nextjs.org), [Remix](https://remix.run/), or [Gatsby](https://www.gatsbyjs.com/).

- [Chat on Discord](https://rakkasjs.org/chat)
- [Follow on Twitter](https://twitter.com/cyco130)

Important features are:

- ⚡&nbsp; Lightning fast development server
- 🖥️&nbsp; Streaming SSR with Suspense
- 🔀&nbsp; Dynamic rendering (full static pages for bots, streaming for browsers)
- ⬇️&nbsp; API-less data fetching system
- 🚀&nbsp; Support for serverless and worker environments
- 📄&nbsp; Static site generation
- 📁&nbsp; Flexible file system router
- ⚙️&nbsp; API routes with middleware support

## Is Rakkas right for you?

- Although many features have been implemented, Rakkas is still under heavy development. It uses **experimental and/or beta features** of React and Vite. Minor releases will introduce breaking changes until we hit 1.0. As such, it's **not yet ready for production use**. If you need a stable React framework try Next.js, Remix, or Gatsby.
- Rakkas is fairly opinionated. If you need more flexibility try [vite-ssr-plugin](https://vite-plugin-ssr.com/).

## Getting started

> 🚀 See Rakkas in action in your browser:
>
> - [CodeSandbox](https://codesandbox.io/s/github/rakkasjs/rakkasjs/tree/main/examples/todo?file=/src/routes/index.page.tsx)
> - [StackBlitz](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/main/examples/todo?file=src%2Froutes%2Findex.page.tsx)

To generate a Rakkas application boilerplate use one of the following commands:

```bash
npx create-rakkas-app@latest my-rakkas-app
# or
pnpm create rakkas-app my-rakkas-app
# or
yarn create rakkas-app my-rakkas-app
```

`create-rakkas-app` project initializer comes with many features, all of which are optional but we strongly recommend enabling TypeScript and the generation of a demo project on your first try because self-documenting type definitions allow for a smoother learning curve and the demo project source code comes with plenty of comments.

> 👷 If you prefer a manual setup, you can install the following packages:
>
> ```bash
> npm install --save react react-dom
> npm install --save-dev vite rakkasjs
> ```
>
> Then create a `src/routes/index.page.jsx` file like this:
>
> ```jsx
> export default function HomePage() {
>   return <h1>Hello world!</h1>;
> }
> ```
>
> Now you can:
>
> - Start a development server with `npx rakkas`
> - Build with `npx rakkas build`
> - Launch with `node dist/server/index.js`

## Credits

- [Fatih Aygün](https://github.com/cyco130) and [contributors](#contributors), under [MIT License](https://opensource.org/licenses/MIT).
- Logomark: “Flamenco” by [gzz from Noun Project](https://thenounproject.com/term/flamenco/111303) (not affiliated) under [Creative Commons Attribution Generic license (CCBY)](https://creativecommons.org/licenses/by/2.0/)
- Parts of the CLI are based on [Vite CLI](https://github.com/vitejs/vite/tree/main/packages/vite) by Yuxi (Evan) You (not affiliated) and Vite contributors (not affiliated), used under [MIT License](./vite-license.md).
- Published npm package bundles the following software:
  - [`@brillout/json-serializer`](https://github.com/brillout/json-serializer) by Romuald Brillout (not affiliated), used under [MIT License](./json-s-license.md).
  - [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) by Brian Vaughn (not affiliated), used under [MIT License](./react-error-boundary-license.txt)
  - [`@microsoft/fetch-event-source`](https://github.com/Azure/fetch-event-source) by Microsoft Corporation (not affiliated), used under [MIT License](./microsoft-fetch-event-source-license.md)

## Contributors

<a href="https://github.com/rakkasjs/rakkasjs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rakkasjs/rakkasjs&max=10" />
</a>

## Version history

## 0.7.0 (install with `rakkasjs@next`)

- Replace `react-helmet-async` with a custom component (reduces bundle size by 17KB)

## 0.6.0

- React 18
  - Concurrent mode
  - Streaming SSR
  - Suspense for data fetching
- Vite 3
  - ESM SSR build (`"type": "module"`)
  - Improved cold start
- Brand new data fetching system
  - `react-query`-inspired `useQuery` and `useMutation`
  - Remix-inspired action handlers
  - API-less data fetching with `useServerSideQuery`
  - Waterfall-free `preload` functions
  - Remix-inspired form action handlers
- HatTip
  - HTTP handling based on web standards
  - Adapters for Vercel Edge, Netlify Edge, and Deno/Deno Deploy
  - Express integration
- Routing improvements
  - Route guards
  - Catch-all routes
  - Simpler 404 handling
- Miscellaneous
  - Response headers customization
  - Shared ESLint configuration

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
