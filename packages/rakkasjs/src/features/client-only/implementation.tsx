import React, {
	ReactElement,
	ReactNode,
	Suspense,
	useContext,
	useEffect,
} from "react";
import { createNamedContext } from "../../runtime/named-context";

/** {@link ClientOnly} props */
export interface ClientOnlyProps {
	/** Fallback to be rendered during SSR */
	fallback: ReactNode;
	/** Content to be rendered on client-side */
	children: ReactNode;
}

// TODO: Strip ClientOnly component's children out of the SSR bundle

/** Opt out of server-side rendering */
export function ClientOnly(props: ClientOnlyProps): ReactElement {
	const context = useContext(ClientOnlyContext);

	useEffect(() => {
		if (!context.hydrated) {
			context.setHydrated();
		}
	}, [context]);

	return <>{context && context.hydrated ? props.children : props.fallback}</>;
}

/** Suspense boundary that only runs on the client */
export function ClientSuspense(props: ClientOnlyProps): ReactElement {
	return (
		<ClientOnly fallback={props.fallback}>
			<Suspense fallback={props.fallback}>{props.children}</Suspense>
		</ClientOnly>
	);
}

export const ClientOnlyContext = createNamedContext<{
	hydrated: boolean;
	setHydrated: () => void;
}>("ClientOnlyContext", undefined as any);
