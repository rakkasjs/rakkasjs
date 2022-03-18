import React, {
	createContext,
	ReactElement,
	ReactNode,
	useContext,
	useEffect,
} from "react";

export interface ClientSideProps {
	/** Fallback to be rendered during SSR */
	fallback: ReactNode;
	/** Content to be rendered on client-side */
	children: ReactNode;
}

// TODO: Strip ClientSide component's children out of the SSR bundle

/** Opt out of server-side rendering */
export function ClientSide(props: ClientSideProps): ReactElement {
	const context = useContext(ClientSideContext);

	useEffect(() => {
		if (!context.hydrated) {
			context.setHydrated();
		}
	}, [context]);

	return <>{context.hydrated ? props.children : props.fallback}</>;
}

export const ClientSideContext = createContext<{
	hydrated: boolean;
	setHydrated: () => void;
}>({
	hydrated: false,
	setHydrated: () => {
		// Do nothing
	},
});
