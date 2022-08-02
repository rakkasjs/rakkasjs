import type { CommonHooks } from "rakkasjs";

const hooks: CommonHooks = {
	beforePageLookup(_ctx, url) {
		if (url.pathname === "/before-route/redirect") {
			return { redirect: "/before-route/redirected" };
		} else if (url.pathname === "/before-route/rewrite") {
			return { rewrite: "/before-route/rewritten" };
		} else {
			return true;
		}
	},
};

export default hooks;
