import React, { ReactElement, useReducer } from "react";
import { ClientOnlyContext } from "./implementation";

export function onRender(app: ReactElement): ReactElement {
	return <ClientOnlyWrapper>{app}</ClientOnlyWrapper>;
}

function ClientOnlyWrapper(props: { children: ReactElement }) {
	const [hydrated, setHydrated] = useReducer(() => true, false);

	return (
		<ClientOnlyContext.Provider value={{ hydrated, setHydrated }}>
			{props.children}
		</ClientOnlyContext.Provider>
	);
}
