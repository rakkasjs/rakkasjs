import React, {
	createContext,
	ReactElement,
	ReactNode,
	useContext,
	useEffect,
} from "react";

/** {@link ClientOnly} props */
export interface ClientOnlyProps {
	/** Fallback to be rendered during SSR */
	fallback: ReactNode;
	/** Content to be rendered on client-side */
	children: ReactNode;
}

// TODO: Strip ClientOnly component's children out of the SSR bundle

/** Component for opting out of server-side rendering */
export function ClientOnly(props: ClientOnlyProps): ReactElement {
	const context = useContext(ClientOnlyContext);

	useEffect(() => {
		if (!context.hydrated) {
			context.setHydrated();
		}
	}, [context]);

	return <>{context && context.hydrated ? props.children : props.fallback}</>;
}

export const ClientOnlyContext = createContext<{
	hydrated: boolean;
	setHydrated: () => void;
}>(undefined as any);
