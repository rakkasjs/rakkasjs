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

	return (
		<Suspense fallback={props.fallback}>
			{isHydrated ? props.children : props.fallback}
		</Suspense>
	);
}

/**
 * @deprecated {@link ClientOnly} now has the exact same functionality.
 */
export const ClientSuspense = ClientOnly;
