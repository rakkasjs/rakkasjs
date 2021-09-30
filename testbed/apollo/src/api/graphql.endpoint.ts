import { ApolloServer } from "@rakkasjs/apollo-server";
import { schema } from "../schema";

const server = new ApolloServer({
	schema,
	context: (request) => request,
});

export default server.createHandler();
