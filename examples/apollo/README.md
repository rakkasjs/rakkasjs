# Rakkas Apollo Example

This is an example [Apollo GraphQL](https://www.apollographql.com/) setup for Rakkas with full SSR support. It shows how to integrate both with Apollo Client and Apollo Server.

[Try it in your browser](https://stackblitz.com/github/rakkasjs/rakkasjs/tree/main/examples/apollo?file=src%2Fpages%2Fpage.tsx)

...or on your computer:

```sh
npx degit rakkasjs/rakkasjs/examples/apollo
```

Apollo Client integration consists of defining some customization hooks to wrap your application in ApolloProvider and send server-rendered data to the client by serializing in in the HTML head.

For Apollo Server, Rakkas provides a `@rakkasjs/apollo-server` package to greatly simplify the creation of a GraphQL endpoint.

## Manual setup procedure

For Apollo Client:
- Install `@apollo/client` and `graphql`.
- See [server.tsx](./src/server.tsx) and [client.tsx](./src/client.tsx) on how to set up load helpers and SSR.

For Apollo Server:
- Install `@rakkasjs/apollo-server`, `graphql` and `@graphql-tools/schema`.
- Create a schema like in [schema.ts](./src/schema.ts) and an endpoint like in [graphql.endpoint.ts](./src/api/graphql.endpoint.ts).