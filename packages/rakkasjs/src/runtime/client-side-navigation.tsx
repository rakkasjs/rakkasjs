import {
	createContext,
	useCallback,
	useContext,
	useDeferredValue,
	useSyncExternalStore,
} from "react";

export function useLocation() {
	const staticLocation = useContext(LocationContext);

	const currentLocation = useSyncExternalStore(
		subscribeToLocation,
		getLocationSnapshot,
		useCallback(() => staticLocation, [staticLocation]),
	);

	const deferredLocation = useDeferredValue(currentLocation);

	return {
		current: deferredLocation,
		pending: currentLocation === deferredLocation ? undefined : currentLocation,
	};
}

export interface NavigationOptions {
	replace?: boolean;
	scroll?: boolean;
	data?: any;
}

export async function navigate(to: string, options?: NavigationOptions) {
	const url = new URL(to, location.href);

	if (url.origin !== location.origin) {
		location.href = url.href;
		return;
	}

	const { replace, data } = options || {};
	const id = createUniqueId();

	if (replace) {
		history.replaceState({ id, data, index: history.state.index }, "", to);
	} else {
		const index = nextIndex++;
		history.pushState({ id, data, index }, "", to);
	}

	return handleNavigation();
}

export const LocationContext = createContext<string | undefined>(undefined);

const locationChangeListeners = new Set<() => void>();

function subscribeToLocation(onStoreChange: () => void): () => void {
	locationChangeListeners.add(onStoreChange);
	return () => locationChangeListeners.delete(onStoreChange);
}

function getLocationSnapshot(): string {
	return window.location.href;
}

export function initialize() {
	addEventListener("popstate", handleNavigation);
}

async function handleNavigation() {
	locationChangeListeners.forEach((listener) => listener());
}

function createUniqueId(): string {
	return Math.random().toString(36).substr(2, 9);
}

let nextIndex = 0;
