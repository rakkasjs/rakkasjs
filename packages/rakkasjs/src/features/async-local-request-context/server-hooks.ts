import { ServerHooks } from "../../lib";
import { requestContextStorage } from "./implementation";

const asyncLocalRequestContextServerHooks: ServerHooks = {
	middleware: {
		beforeAll: [(ctx) => requestContextStorage?.run(ctx, ctx.next)],
	},
};

export default asyncLocalRequestContextServerHooks;
