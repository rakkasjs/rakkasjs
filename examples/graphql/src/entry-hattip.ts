import { createRequestHandler } from "rakkasjs/server";
import { yoga, createSchema } from "@hattip/graphql";
import type { RequestContext } from "rakkasjs";

let yogaMiddleware: ReturnType<typeof yoga> | undefined;

const schema = createSchema<{ requestContext: RequestContext }>({
	typeDefs: `type Query { hello: String! }`,
	resolvers: {
		Query: {
			hello: () => "Hello world!",
		},
	},
});

export default createRequestHandler({
	middleware: {
		beforePages: [
			(ctx) => {
				if (ctx.url.pathname !== "/graphql") {
					return;
				}

				// We have to create this lazily so that
				// the fetch API injection is available.
				if (!yogaMiddleware) {
					yogaMiddleware = yoga({
						graphqlEndpoint: "/graphql",

						fetchAPI: {
							fetch,
							Response,
							Request,
							ReadableStream,
						},

						graphiql: import.meta.env.PROD
							? false
							: { defaultQuery: `query { hello }` },

						schema,
					});
				}

				return yogaMiddleware(ctx);
			},
		],
	},
});
