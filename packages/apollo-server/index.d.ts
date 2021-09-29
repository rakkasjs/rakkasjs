import { RakkasRequest, RequestHandler } from "rakkasjs";
import { ApolloServerBase } from "apollo-server-core";

export declare class ApolloServer<
	T extends RakkasRequest = RakkasRequest,
> extends ApolloServerBase<T> {
	createHandler(): RequestHandler;
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
