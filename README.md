# Rakkas

![](shared-assets/logo.png)

[Read the guide to learn more!](https://rakkasjs.org/guide)

## What is Rakkas?

**Rakkas** is a web framework powered by [React](https://reactjs.org) and [Vite](https://vitejs.dev) that aims to have a developer experience similar to [Next.js](https://nextjs.org). Many of its features are also inspired by [Svelte Kit](https://kit.svelte.dev). Important features are:

- ⚡&nbsp; Lightning fast development
- 🖥️&nbsp; Hassle free server-side rendering
- ☸️&nbsp; SPA-style client-side navigation
- 📁&nbsp; Intuitive file system-based routing
- ⬇️&nbsp; Simple but effective data fetching system
- ⚙️&nbsp; API routes to build and organize your backend

We're also aiming to support **static site generation** and **deploying to serverless environments** before we hit 1.0.

> ### Is Rakkas right for you?
>
> - Although many features have been implemented, Rakkas is still in development. There _will_ be breaking changes until we hit 1.0. As such, it's not yet ready for production use. If you need a stable React framework try Next.js or [Gatsby](https://www.gatsbyjs.com/).
> - Rakkas doesn't aim compatibility with Next.js. Check out [Vitext](https://github.com/Aslemammad/vitext) if you want to port a Next.js application to Vite.
> - Rakkas is somewhat opinionated. If you need more flexibility try [vite-ssr-plugin](https://vite-plugin-ssr.com/).

## Getting started

> 🚀 You can now **try Rakkas online, right in your browser**!
>
> - [Rakkas **TypeScript** demo app on StackBlitz](https://stackblitz.com/edit/rakkas-demo-ts?file=src%2Fpages%2Fpage.tsx)
> - [Rakkas **JavaScript** demo app on StackBlitz](https://stackblitz.com/edit/rakkas-demo?file=src%2Fpages%2Fpage.jsx)

The easiest way to try Rakkas out on your computer is to use the project initializer:

```sh
# Create the project directory
mkdir my-app && cd my-app
# Scaffold the demo app: Follow the prompts for the rest
npx create-rakkas-app
```

`create-rakkas-app` project initializer comes with many features, all off which are optional but we strongly recommend enabling TypeScript on your first project because self-documenting type definitions allow for a smoother learning curve.

Demo project's source code comes with plenty of comments, you may not need to read the guide!

> 👷 If you prefer a manual setup, you can install `rakkasjs`, `@rakkasjs/runner-node`, `react`, `react-dom`, and `react-helmet-async` as production dependencies, and `@rakkasjs/cli` as a dev dependency:
>
> ```sh
> npm install --save rakkasjs @rakkasjs/runner-node react react-dom react-helmet-async
> npm install --save-dev @rakkasjs/cli
> ```
>
> Then you can start a development server on `localhost:3000` with `npx rakkas dev`, build with `npx rakkas build`, and launch with `npx @rakkasjs/runner-node`.

## Credits
- [Fatih Aygün](https://github.com/cyco130), under [MIT License](https://opensource.org/licenses/MIT).
- Logomark: “Flamenco” by [gzz from Noun Project](https://thenounproject.com/term/flamenco/111303) (not affiliated) under [Creative Commons Attribution Generic license (CCBY)](https://creativecommons.org/licenses/by/2.0/)
