# Rakkas

---

**DO NOT USE IN PRODUCTION! This project is still in early exploratory phase. It's not even alpha quality.**

---

![](shared-assets/logo.png)

## What is Rakkas?

> Elevator pitch: Rakkas is Next.js on Vite or Svelte Kit for React.

[READ THE GUIDE!](https://rakkasjs.org)

**Rakkas** aims to be a [React](https://reactjs.org) framework powered by [Vite](https://vitejs.dev), with a developer experience inspired by [Next.js](https://nextjs.org) and [Svelte Kit](https://kit.svelte.dev).

> **WARNING:** Rakkas is in early development. Do not use in production!

Rakkas stands on the shoulders of React and Vite. They bring the following to the table:

- React:
  - Declarative coding style
  - Component-based architecture
  - Vast ecosystem and learning resources
- Vite:
  - Lightning fast development environment with Fast Refresh support
  - Automatic code splitting (including CSS)
  - Support for CSS modules and preprocessors

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

The easiest way to try Rakkas out is to clone the TypeScript demo app:

```sh
# Create the project directory
mkdir my-app && cd my-app
# Clone the TypeScript demo app
npx degit rakkasjs/rakkasjs/starters/starter
# Install dependencies
npm install
```

Now `npm run dev` will start a development server, `npm run build` will build for production, and `npm start` will start the production server. You can clone `rakkasjs/rakkasjs/starters/starter-js` if you don't like TypeScript and prefer vanilla JavaScript but type definitions are self-documenting so it is easier to learn with the TypeScript demo.

Demo projects' source code come with plenty of comments, you may not need this guide!

> If you prefer a manual setup, you can install `rakkasjs`, `@rakkasjs/runner-node`, `react`, `react-dom`, and `react-helmet-async` as production dependencies, and `@rakkasjs/cli` as a dev dependency:

```sh
npm install --save rakkasjs @rakkasjs/runner-node react react-dom react-helmet-async
npm install --save-dev @rakkasjs/cli
```

Then you can start a development server on `localhost:3000` with `npx rakkas dev`, build with `npx rakkas build`, and launch with `npx @rakkasjs/runner-node`.

