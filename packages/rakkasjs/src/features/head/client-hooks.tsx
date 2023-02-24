import React from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { clientHeadTags, HeadContext } from "./implementation";

export default defineClientHooks({
	wrapApp(app) {
		return (
			<HeadContext.Provider value={clientHeadTags}>{app}</HeadContext.Provider>
		);
	},
});
