import { ApolloServer } from "@rakkasjs/apollo-server";
import { schema } from "../schema";

const server = new ApolloServer({
	schema,
	// You can create a more complex context object here
	context: (request) => request,
});

export default server.createHandler();
