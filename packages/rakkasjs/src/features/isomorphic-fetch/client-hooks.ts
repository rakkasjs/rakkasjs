import { defineClientHooks } from "../../runtime/client-hooks";

export default defineClientHooks({
	extendPageContext(ctx) {
		ctx.fetch = (input, init) => fetch(input, init);
	},
});
