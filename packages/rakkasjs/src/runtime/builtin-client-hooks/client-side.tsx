import React, { ReactElement, useReducer } from "react";
import { ClientSideContext } from "../../lib/ClientSide";

export function wrapApp(app: ReactElement): ReactElement {
	return <ClientSideWrapper>{app}</ClientSideWrapper>;
}

function ClientSideWrapper(props: { children: ReactElement }) {
	const [hydrated, setHydrated] = useReducer(() => true, false);

	return (
		<ClientSideContext.Provider value={{ hydrated, setHydrated }}>
			{props.children}
		</ClientSideContext.Provider>
	);
}
