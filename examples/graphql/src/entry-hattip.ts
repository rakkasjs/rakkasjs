import { createRequestHandler } from "rakkasjs";
import { yoga } from "@hattip/graphql";

let yogaMiddleware: ReturnType<typeof yoga> | undefined;

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
						endpoint: "/graphql",

						fetchAPI: {
							fetch,
							Response,
							Request,
							ReadableStream,
						},

						graphiql: import.meta.env.PROD
							? false
							: {
									defaultQuery: `query { hello }`,
							  },

						schema: {
							typeDefs: `type Query { hello: String! }`,
							resolvers: {
								Query: {
									hello: () => "Hello world!",
								},
							},
						},
					});
				}

				return yogaMiddleware(ctx);
			},
		],
	},
});
