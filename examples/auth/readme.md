# Rakkas Auth.js Example

[Auth.js](https://authjs.dev) is a framework-agnostic rewrite of NextAuth, a popular authentication library for Next.js. This example shows how to integrate it with Rakkas.

## Setting up the environment

After installing dependencies, create a `.env` file in the root of the project and define the following environment variables:

```bash
SERVER_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

You can generate a server secret with `npm run gen-secret`. You only need one of GitHub or Discord credentials. See the Auth.js documentation to learn how to create [GitHub](https://authjs.dev/reference/core/providers_github) or [Discord](https://authjs.dev/reference/core/providers_discord) credentials. You can also use any of the other providers supported by Auth.js.

## How it works

The [entry-hattip.ts](src/entry-hattip.ts) file contains a `beforePages` middleware that handles the integration. It catches requests to `/auth/*` URLs and channels them into the Auth handler.

It also creates a `extendPageContext` hook. This hook is normally used for extending the `PageContext` that is available throughout the page. In this case, it's used to preload query keys `auth:session` and `auth:csrfToken` that can be later used in pages via `useQuery`.

The [auth.ts](src/lib/auth.ts) file contains two custom hooks, `useAuthSession` and `useCsrf`. These hooks can be used anywhere in the application to access the session data and the CSRF token.

The [main layout](src/routes/layout.tsx) uses these hooks to display the currently signed-in user if any, or a "sign in" link otherwise.

There are two pages, a home page at `/` that is accessible to everyone, and a protected page at `/guarded` that is only accessible to signed-in users. The `/guarded` page is guarded by a [route guard](src/routes/guarded/$guard.ts) that reads the session data from the query client and redirects to the "sign in" page if the user is not signed in.
