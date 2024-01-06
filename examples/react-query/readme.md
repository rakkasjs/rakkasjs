# Rakkas @tanstack/react-query integration example

This is a port of Rakkas's simple TODO demo to use `@tanstack/react-query` instead of Rakkas's built-in data fetching hooks (which are also inspired by React Query).

- The integration is implemented in `src/entry-hattip.tsx` and `src/entry-client.tsx` files.
- You can access the query client from `preload` functions using `ctx.reactQueryClient` (`ctx.queryClient` is Rakkas's own query client).
- As a general rule, you should use `useSuspenseQuery` and other Suspense-based hooks instead of plain `useQuery`.
- To simulate Rakkas's `useServerSideQuery` and `useServerSideMutation`, you can use `runServerSideQuery` and `runServerSideMutation`. `runServerSideQuery` expects a request context object as its first argument which you can access with the `useRequestContext` hook in components or via `ctx.requestContext` in `preload` functions.
- To avoid accidental name collisions with Rakkas's own hooks, you can consider using the [no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports) ESLint rule like this:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "rakkasjs",
            "importNames": ["useQuery", "useMutation"],
            "message": "import from '@tanstack/react-query' instead"
          }
        ]
      }
    ]
  }
}
```
