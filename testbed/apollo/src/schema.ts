import { gql } from "@rakkasjs/apollo-server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { IResolvers } from "@graphql-tools/utils";
import { RakkasRequest } from "rakkasjs";

export const schema = makeExecutableSchema<RakkasRequest>({
	typeDefs: gql`
		type Query {
			data1: String
			data2: String
			data3: String
		}
	`,
	resolvers: {
		Query: {
			data1: (parent, args, context, info) => {
				return "data1 response";
			},
			data2: (parent, args, context, info) => {
				return "data2 response";
			},
			data3: (parent, args, context, info) => {
				return "data3 response";
			},
		},
	},
});
