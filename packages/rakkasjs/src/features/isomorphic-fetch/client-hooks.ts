import { defineClientHooks } from "../../runtime/client-hooks";

export default defineClientHooks({
	augmentQueryContext(ctx) {
		ctx.fetch = (input, init?) => fetch(input, init);
	},
});
