/// <reference types="react/next" />

import React, {
	AnchorHTMLAttributes,
	createContext,
	CSSProperties,
	forwardRef,
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";

export function useLocation() {
	const staticLocation = useContext(LocationContext);

	const currentLocation = useSyncExternalStore(
		subscribeToLocation,
		getLocationSnapshot,
		useCallback(() => staticLocation!, [staticLocation]),
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

if (typeof window !== "undefined") {
	(window as any).navigate = navigate;
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

// TODO: Implement onNavigationEnd

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	historyState?: any;
	noScroll?: boolean;
	replaceState?: boolean;
	onNavigationStart?: () => void;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			onClick,
			historyState,
			noScroll,
			replaceState,
			onNavigationStart,
			...props
		},
		ref,
	) => (
		<a
			{...props}
			ref={ref}
			onClick={(e) => {
				onClick?.(e);
				if (!shouldHandleClick(e)) {
					return;
				}

				onNavigationStart?.();

				navigate(e.currentTarget.href, {
					data: historyState,
					replace: replaceState,
					scroll: !noScroll,
				});

				e.preventDefault();
			}}
		/>
	),
);

Link.displayName = "Link";

export interface StyledLinkProps extends LinkProps {
	/** Class to be added if `href` matches the current URL */
	activeClass?: string;
	/** Style to be added if `href` matches the current URL */
	activeStyle?: CSSProperties;

	/** Class to be added if navigation is underway because the user clicked on this link */
	pendingClass?: string;
	/** Style to be added if navigation is underway because the user clicked on this link */
	pendingStyle?: CSSProperties;

	/**
	 * Custom comparison function for checking if the current URL matches this link
	 * @param url  URL to be compared to `href`
	 * @param href Value of `href` property, passed for convenience
	 *
	 * @returns true if the URL matches `href`
	 */
	onCompareUrls?(url: URL, href: URL): boolean;
}

/**
 * Like {@link Link} but allows adding classes and/or styles based on whether this is the active URL.
 */
export const StyledLink = forwardRef<HTMLAnchorElement, StyledLinkProps>(
	(
		{
			activeClass,
			pendingClass,
			pendingStyle,
			activeStyle,
			onCompareUrls = defaultCompareUrls,
			onNavigationStart,
			className,
			style,

			...props
		},
		ref,
	) => {
		const [navigating, setNavigating] = useState(false);
		const { current, pending } = useLocation();

		const hasPending = !!pending;

		useEffect(() => {
			if (!hasPending) {
				setNavigating(false);
			}
		}, [hasPending]);

		const classNames = className ? [className] : [];

		if (
			props.href !== undefined &&
			(activeClass || pendingClass || activeStyle || pendingStyle)
		) {
			const url = new URL(props.href, current);
			if (navigating) {
				if (pendingClass) classNames.push(pendingClass);
				if (pendingStyle) style = { ...style, ...pendingStyle };
			}

			if (current && onCompareUrls(new URL(current), url)) {
				if (activeClass) classNames.push(activeClass);
				if (activeStyle) style = { ...style, ...activeStyle };
			}
		}

		return (
			<Link
				{...props}
				ref={ref}
				className={classNames.join(" ") || undefined}
				style={style}
				onNavigationStart={() => {
					setNavigating(true);
					onNavigationStart?.();
				}}
			/>
		);
	},
);

StyledLink.displayName = "StyledLink";

function defaultCompareUrls(a: URL, b: URL) {
	return a.href === b.href;
}

export interface MouseEventLike {
	currentTarget: EventTarget | null;
	defaultPrevented: boolean;
	button: number;
	shiftKey: boolean;
	altKey: boolean;
	ctrlKey: boolean;

	preventDefault(): void;
}

function shouldHandleClick(e: MouseEventLike): boolean {
	const t = e.currentTarget;

	return (
		(t instanceof HTMLAnchorElement ||
			t instanceof SVGAElement ||
			t instanceof HTMLAreaElement) &&
		!e.defaultPrevented &&
		t.href !== undefined &&
		e.button === 0 &&
		!e.shiftKey &&
		!e.altKey &&
		!e.ctrlKey &&
		(!t.target || t.target === "_self") &&
		!t.hasAttribute("download") &&
		!t.relList.contains("external")
	);
}
