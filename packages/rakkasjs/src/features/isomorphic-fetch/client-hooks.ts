import { defineClientHooks } from "../../runtime/client-hooks";

export default defineClientHooks({
	extendQueryContext(ctx) {
		ctx.fetch = (input, init?) => fetch(input, init);
	},
});
