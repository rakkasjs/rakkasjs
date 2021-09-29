import { ApolloServer, gql } from "@rakkasjs/apollo-server";

const server = new ApolloServer({
	typeDefs: gql`
		type Query {
			hello: String
		}
	`,
	resolvers: {
		Query: {
			hello: (parent, args, context, info) => {
				return "world";
			},
		},
	},
	context: (request) => request,
});

export default server.createHandler();
