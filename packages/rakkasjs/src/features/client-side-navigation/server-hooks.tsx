import React from "react";
import { CreateServerHooksFn } from "../../runtime/server-hooks";
import { LocationContext } from "./implementation";

const createClientSideNavigationServerHooks: CreateServerHooksFn = (
	request,
	ctx,
) => ({
	wrapApp(app) {
		return (
			<LocationContext.Provider value={ctx.url.href}>
				{app}
			</LocationContext.Provider>
		);
	},
});

export default createClientSideNavigationServerHooks;
