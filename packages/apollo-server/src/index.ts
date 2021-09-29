import { RakkasRequest, RequestHandler } from "rakkasjs";
import { runHttpQuery, ApolloServerBase, Config } from "apollo-server-core";

export class ApolloServer<T extends RakkasRequest> extends ApolloServerBase<T> {
	public serverlessFramework() {
		return true;
	}

	public createHandler(): RequestHandler {
		return async (req: RakkasRequest) => {
			let query: Record<string, any>;

			if (req.method === "GET") {
				query = {
					query: req.url.searchParams.get("query"),
					variables: req.url.searchParams.get("variables"),
					operationName: req.url.searchParams.get("operationName"),
					extensions: req.url.searchParams.get("extensions"),
				};
			} else if (req.method === "POST") {
				if (req.type !== "json") return { status: 415 };
				query = req.body;
			} else {
				return { status: 405 };
			}

			const result = await runHttpQuery([req], {
				method: req.method,
				query,
				request: {
					method: req.method,
					headers: req.headers as any,
					url: req.url.href.slice(req.url.origin.length),
				},
				options: await super.graphQLServerOptions(req),
			});

			return {
				...result.responseInit.headers,
				body: result.graphqlResponse,
			};
		};
	}
}

export {
	GraphQLOptions,
	Config,
	gql,
	// Errors
	ApolloError,
	toApolloError,
	SyntaxError,
	ValidationError,
	AuthenticationError,
	ForbiddenError,
	UserInputError,
} from "apollo-server-core";
