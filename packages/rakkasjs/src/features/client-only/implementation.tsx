import React, { type ReactNode, Suspense, useSyncExternalStore } from "react";

/** {@link ClientOnly} props */
export interface ClientOnlyProps {
	/** Fallback to be rendered during SSR */
	fallback: ReactNode;
	/** Content to be rendered on client-side */
	children: ReactNode;
}

// TODO: Strip ClientOnly component's children out of the SSR bundle

/** Opt out of server-side rendering */
export function ClientOnly(props: ClientOnlyProps): ReactNode {
	const isHydrated = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	return isHydrated ? props.children : props.fallback;
}

/** Suspense boundary that only runs on the client */
export function ClientSuspense(props: ClientOnlyProps): ReactNode {
	return (
		<ClientOnly fallback={props.fallback}>
			<Suspense fallback={props.fallback}>{props.children}</Suspense>
		</ClientOnly>
	);
}
