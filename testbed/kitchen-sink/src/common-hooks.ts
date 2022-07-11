import type { CommonHooks } from "rakkasjs";

const hooks: CommonHooks = {
	beforeRoute(_ctx, url) {
		if (url.pathname === "/before-route/redirect") {
			return { redirect: "/before-route/redirected" };
		} else if (url.pathname === "/before-route/rewrite") {
			return { rewrite: "/before-route/rewritten" };
		}
	},
};

export default hooks;
