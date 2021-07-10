# Rakkas

---

**DO NOT USE IN PRODUCTION! This project is still in early exploratory phase. It's not even alpha quality.**

---

![](shared-assets/logo.png)

## What is Rakkas?

[READ THE GUIDE!](https://rakkasjs.org)

**Rakkas** is a [React](https://reactjs.org) framework powered by [Vite](https://vitejs.dev) that aims to have a developer experience inspired by [Next.js](https://nextjs.org) and [Svelte Kit](https://kit.svelte.dev).

> **WARNING:** Rakkas is in early development. Do not use in production!

Rakkas stands on the shoulders of React and Vite. They bring the following to the table:

- React:
  - Declarative coding style
  - Component-based architecture
  - Vast ecosystem and learning resources
- Vite:
  - Lightning fast development environment with Fast Refresh support
  - Automatic code splitting (including CSS)
  - Built-in support for TypeScript, CSS modules, and CSS preprocessors

On top of all this awesomeness, Rakkas comes bundled with its own features:

- [x] Hassle free server-side rendering
- [x] Intuitive file system-based routing
  - [x] Dynamic routes
  - [x] Nested layouts
  - [x] Thematic grouping
- [x] SPA-style client-side router
- [x] Simple but effective data fetching system
  - [ ] Soon: Optional caching and "stale while revalidate" strategy
- [x] API routes to build API endpoints and middleware
- [ ] Soon: Support for serverless environments

## Getting started

The easiest way to try Rakkas out is to use the project initializer:

```sh
# Create the project directory
mkdir my-app && cd my-app
# Scaffold the demo app: Follow the prompts for the rest
npm init rakkas-app
```

`create-rakkas-app` project initializer comes with many features, all off which are optional but we strongly recommend enabling TypeScript on your first project because self-documenting type definitions allow for a smoother learning curve.

Demo project's source code comes with plenty of comments, you may not need this guide!

If you prefer a manual setup, you can install `rakkasjs`, `@rakkasjs/runner-node`, `react`, `react-dom`, and `react-helmet-async` as production dependencies, and `@rakkasjs/cli` as a dev dependency:
```sh
npm install --save rakkasjs @rakkasjs/runner-node react react-dom react-helmet-async
npm install --save-dev @rakkasjs/cli
```
Then you can start a development server on `localhost:3000` with `npx rakkas dev`, build with `npx rakkas build`, and launch with `npx @rakkasjs/runner-node`.
