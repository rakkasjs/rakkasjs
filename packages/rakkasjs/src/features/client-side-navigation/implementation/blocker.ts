import { useEffect, useRef, useState } from "react";

export function findBlocker(): Blocker | undefined {
	for (const blocker of blockers) {
		if (blocker.enabled) {
			return blocker;
		}
	}
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
	if (findBlocker()) {
		e.preventDefault();
		// eslint-disable-next-line deprecation/deprecation
		e.returnValue = "";
	}
}

interface Blocker {
	notify(): void;
	redo?(): void;
	enabled: boolean;
}

const blockers = new Set<Blocker>();

export type NavigationBlockerResult =
	| {
			isBlocking: false;
			leave?: undefined;
			stay?: undefined;
	  }
	| {
			isBlocking: true;
			leave(): void;
			stay(): void;
	  };

/**
 * Add a navigation blocker.
 *
 * When a navigation blocker is active, the hook will return an object with
 * `isBlocking` set to `true`. The `leave` method will allow the navigation to
 * proceed, while the `stay` method will keep the navigation from happening.
 *
 * @param condition Whether to block navigation
 */
export function useNavigationBlocker(
	condition: boolean,
): NavigationBlockerResult {
	const [isBlocking, setIsBlocking] = useState(false);
	const blocker = useRef<Blocker>({
		notify() {
			setIsBlocking(true);
		},
		enabled: true,
	});

	useEffect(() => {
		if (!condition && !isBlocking) {
			return;
		}

		const current = blocker.current;

		blockers.add(current);
		if (blockers.size === 1) {
			addEventListener("beforeunload", handleBeforeUnload);
		}

		return () => {
			blockers.delete(current);
			if (blockers.size === 0) {
				removeEventListener("beforeunload", handleBeforeUnload);
			}
		};
	}, [condition, isBlocking]);

	if (isBlocking) {
		return {
			isBlocking,
			leave() {
				const current = blocker.current;
				current.enabled = false;
				current.redo?.();
				setIsBlocking(false);
			},
			stay() {
				setIsBlocking(false);
			},
		};
	}

	return { isBlocking: false };
}
