import React from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { HeadContext } from "./implementation/context";

export default defineClientHooks({
	wrapApp(app) {
		return (
			<HeadContext.Provider value={{ keyed: {}, unkeyed: [] }}>
				{app}
			</HeadContext.Provider>
		);
	},
});
