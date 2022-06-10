import React, { ReactElement, useReducer } from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { ClientOnlyContext } from "./implementation";

export default defineClientHooks({
	onRender(app) {
		return <ClientOnlyWrapper>{app}</ClientOnlyWrapper>;
	},
});

function ClientOnlyWrapper(props: { children: ReactElement }) {
	const [hydrated, setHydrated] = useReducer(() => true, false);

	return (
		<ClientOnlyContext.Provider value={{ hydrated, setHydrated }}>
			{props.children}
		</ClientOnlyContext.Provider>
	);
}
