import { gql } from "@rakkasjs/apollo-server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { RakkasRequest } from "rakkasjs";

export const schema = makeExecutableSchema<RakkasRequest>({
	typeDefs: gql`
		type Query {
			foo: String
			bar: String
			baz: String
		}
	`,
	resolvers: {
		Query: {
			foo: (parent, args, context, info) => {
				return "foo response";
			},
			bar: (parent, args, context, info) => {
				return "bar response";
			},
			baz: (parent, args, context, info) => {
				return "baz response";
			},
		},
	},
});
