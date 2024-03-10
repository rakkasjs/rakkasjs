import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { LocationContext } from "./implementation/link";

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
