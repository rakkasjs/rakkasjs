import React from "react";
import type { ServerHooks } from "../../runtime/hattip-entry";
import { LocationContext } from "./implementation";

const clientSideNavigationServerHooks: ServerHooks = {
	createPageHooks(ctx) {
		return {
			wrapApp(app) {
				return (
					<LocationContext.Provider value={ctx.url.href}>
						{app}
					</LocationContext.Provider>
				);
			},
		};
	},
};

export default clientSideNavigationServerHooks;
