import React, {
	type ReactElement,
	type ReactNode,
	Suspense,
	useEffect,
	useState,
} from "react";

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
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		if (!hydrated) {
			setHydrated(true);
		}
	}, [hydrated]);

	return <>{hydrated ? props.children : props.fallback}</>;
}

/** Suspense boundary that only runs on the client */
export function ClientSuspense(props: ClientOnlyProps): ReactElement {
	return (
		<ClientOnly fallback={props.fallback}>
			<Suspense fallback={props.fallback}>{props.children}</Suspense>
		</ClientOnly>
	);
}
