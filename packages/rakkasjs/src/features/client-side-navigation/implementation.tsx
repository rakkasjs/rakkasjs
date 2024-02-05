import React, {
	AnchorHTMLAttributes,
	CSSProperties,
	forwardRef,
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
	useSyncExternalStore,
	startTransition,
	FormEvent,
	useRef,
} from "react";
import {
	ActionResult,
	useMutation,
	UseMutationErrorResult,
	UseMutationIdleResult,
	UseMutationLoadingResult,
	UseMutationOptions,
	UseMutationSuccessResult,
	usePageContext,
} from "../../lib";
import { createNamedContext } from "../../runtime/named-context";
import { RenderedUrlContext } from "../pages/contexts";

let lastRenderedId: string;
let navigationPromise: Promise<void> | undefined;
let navigationResolve: (() => void) | undefined;

/** Return value of useLocation */
export interface UseLocationResult {
	/** The URL of the current page before any rewrites */
	current: URL;
	/** The URL of the current page after rewrites */
	rendered: URL;
	/** The URL of the page that is being navigated to, if any */
	pending: URL | undefined;
}

let previousNavigationIndex: number | undefined;
let currentNavigationIndex = 0;

/** Hook to get the navigation state */
export function useLocation(): UseLocationResult {
	const staticLocation = useContext(LocationContext);
	const rendered = useContext(RenderedUrlContext);

	const ssrLocation = JSON.stringify([staticLocation!, 0]);

	const currentLocationId = useSyncExternalStore(
		subscribeToLocation,
		getLocationSnapshot,
		useCallback(() => ssrLocation, [ssrLocation]),
	);

	const deferredLocationId = useDeferredValue(currentLocationId);
	const [currentLocation] = JSON.parse(currentLocationId);
	const [deferredLocation] = JSON.parse(deferredLocationId);

	useEffect(() => {
		base().href = deferredLocation;
		lastRenderedId = history.state.id;
		previousNavigationIndex = currentNavigationIndex;
		currentNavigationIndex = history.state.index;

		if (history.state.scroll) {
			restoreScrollPosition();
		}

		navigationResolve?.();
		navigationPromise = undefined;
		navigationResolve = undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deferredLocationId]);

	const current = useMemo(() => new URL(deferredLocation), [deferredLocation]);
	const pending = useMemo(
		() =>
			currentLocationId === deferredLocationId
				? undefined
				: new URL(currentLocation),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentLocationId, deferredLocationId],
	);

	return {
		current,
		pending,
		rendered,
	};
}

/** Cancel the last navigation. Returns a function that "redoes" the cancelled navigation. */
export function cancelLastNavigation(): () => void {
	if (previousNavigationIndex === undefined) {
		throw new Error("No previous navigation to cancel");
	}

	const delta = previousNavigationIndex - currentNavigationIndex;

	history.go(delta);

	currentNavigationIndex = previousNavigationIndex;
	previousNavigationIndex = undefined;

	return () => {
		history.go(-delta);
		previousNavigationIndex = currentNavigationIndex;
		currentNavigationIndex = previousNavigationIndex + delta;
	};
}

function restoreScrollPosition() {
	let scrollPosition: string | null = null;

	try {
		scrollPosition = sessionStorage.getItem(`rakkas:${history.state?.id}`);
	} catch {
		// Ignore
	}

	if (scrollPosition) {
		const { x, y, f } = JSON.parse(scrollPosition);
		if (f) {
			scrollTo(x, y);
			sessionStorage.setItem(
				`rakkas:${history.state?.id}`,
				JSON.stringify({ x, y }),
			);
		}
	} else {
		const hash = location.hash;
		if (hash) {
			const element = document.querySelector(hash);
			if (element) {
				element.scrollIntoView();
			} else {
				scrollTo(0, 0);
			}
		} else {
			scrollTo(0, 0);
		}
	}
}

/** Navigation options */
export interface NavigationOptions {
	/** Replace the current history entry */
	replace?: boolean;
	/** Restore scroll position (or scroll to top) */
	scroll?: boolean;
	/** Custom user data to be stored in the history entry */
	data?: any;
	/** Action data */
	actionData?: any;
}

/**
 * Navigate, using client-side navigation if possible.
 * @param to URL to navigate to
 * @param options Navigation options
 * @returns Whether the navigation was completed or cancelled
 */
export async function navigate(
	to: string | Readonly<URL>,
	options?: NavigationOptions,
): Promise<boolean> {
	const url = new URL(to, location.href);

	if (url.origin !== location.origin) {
		location.href = url.href;
		return new Promise<boolean>(() => {
			// Never resolves
		});
	}

	const { replace, data, actionData, scroll = true } = options || {};
	const id = createUniqueId();

	if (replace) {
		history.replaceState(
			{
				id,
				data,
				actionData,
				index: history.state.index,
				scroll,
			},
			"",
			to,
		);
	} else {
		const index = nextIndex++;
		history.pushState({ id, data, actionData, index, scroll }, "", to);
	}

	navigationPromise =
		navigationPromise ||
		new Promise<void>((resolve) => {
			navigationResolve = resolve;
		});

	handleNavigation(!scroll);

	return navigationPromise.then(() => {
		const complete = history.state.id === history.state.id;

		return complete;
	});
}

export const LocationContext = createNamedContext<string | undefined>(
	"LocationContext",
	undefined,
);

const locationChangeListeners = new Set<() => void>();

function subscribeToLocation(onStoreChange: () => void): () => void {
	locationChangeListeners.add(onStoreChange);
	return () => locationChangeListeners.delete(onStoreChange);
}

let serialId = 0;
let lastLocation: Readonly<[href: string, id: number]>;

function getLocationSnapshot() {
	return JSON.stringify(lastLocation);
}

function base(): HTMLBaseElement {
	const result = document.head.querySelector("base")!;
	if (result) return result;

	return document.head.insertBefore(
		document.createElement("base"),
		document.head.firstChild,
	);
}

export function initialize() {
	base().href = location.href;

	history.replaceState(
		{
			id: createUniqueId(),
			data: null,
			actionData: history.state?.actionData,
			index: 0,
			scroll: true,
		},
		"",
		location.href,
	);

	lastLocation = [location.href, serialId];

	addEventListener("popstate", handleNavigation);
	addEventListener("hashchange", () => {
		const id = createUniqueId();
		const index = nextIndex++;

		history.replaceState(
			{
				id,
				index,
				scroll: true,
			},
			"",
			location.href,
		);
	});
}

function handleNavigation(e: unknown) {
	const scrollPosition = { x: scrollX, y: scrollY, f: !e };

	try {
		sessionStorage.setItem(
			`rakkas:${lastRenderedId}`,
			JSON.stringify(scrollPosition),
		);
	} catch {
		// Ignore
	}

	if (!import.meta.env.SSR) {
		serialId = (serialId + 1) % 0xfff_ffff;
		lastLocation = [location.href, serialId];
	}

	startTransition(() => {
		locationChangeListeners.forEach((listener) => listener());
		rakkas.update?.();
	});
}

function createUniqueId(): string {
	// crypto.randomUUID is not available in some circumstances
	return crypto.randomUUID
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2);
}

let nextIndex = 0;

/** {@link Link} props */
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	/** Data to be passed to the history entry */
	historyState?: any;
	/** Whether to replace the current history entry */
	replaceState?: boolean;
	/** Whether to disable scroll position restoration (or scroll to top) */
	noScroll?: boolean;
	/** Called when navigation starts */
	onNavigationStart?: () => void;
	/** Called when navigation ends or is cancelled */
	onNavigationEnd?: (completed: boolean) => void;
	/**
	 * Whether and when to load the code for the new page. Options are:
	 *
	 * - `"eager"`: Load as soon as the link is rendered
	 * - `"viewport"`: Load when the link enters the viewport
	 * - `"idle"`: Load when the browser is idle (falls back to hover if `requestIdleCallback` is not available)
	 * - `"hover"`: Load when the user hovers over the link
	 * - `"tap"`: Load when the user taps or starts clicking on the link
	 * - `"never"`: Only load when the link is clicked
	 *
	 * @default "hover"
	 */
	prefetch?: "eager" | "viewport" | "idle" | "hover" | "tap" | "never";
	/**
	 * Whether and when to preload the data for the new page. Note that you can't
	 * preload without prefetching, so a more eager preload setting will also
	 * prefetch the code. `true` means preload when the link is prefetched.
	 */
	preload?: "eager" | "viewport" | "idle" | "hover" | "tap" | "never" | true;
}

const prefetchRanks = {
	never: 0,
	tap: 1,
	hover: 2,
	idle: 3,
	viewport: 4,
	eager: 5,
};

/** Link component for client-side navigation */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			onClick,
			historyState,
			noScroll,
			replaceState,
			onNavigationStart,
			onNavigationEnd,
			onMouseEnter,
			onTouchStart,
			onMouseDown,
			prefetch = "hover",
			preload = "never",
			...props
		},
		ref,
	) => {
		const { ref: a, inView } = useInView<HTMLAnchorElement>();

		if (typeof requestIdleCallback === "undefined") {
			if (prefetch === "idle") {
				prefetch = "hover";
			}

			if (preload === "idle") {
				preload = "hover";
			}
		}

		const prefetchRank = prefetchRanks[prefetch] ?? 0;
		const preloadRank =
			prefetchRanks[preload === true ? prefetch : preload] ?? 0;
		const rank = Math.max(prefetchRank, preloadRank);

		const shouldAct = useCallback(
			function shouldPrefetch(action: keyof typeof prefetchRanks): boolean {
				return (
					prefetchRank === prefetchRanks[action] ||
					preloadRank === prefetchRanks[action]
				);
			},
			[prefetchRank, preloadRank],
		);

		const shouldPreload = useCallback(
			function shouldPreload(action: keyof typeof prefetchRanks): boolean {
				return preloadRank === prefetchRanks[action];
			},
			[preloadRank],
		);

		useEffect(() => {
			if (props.href === undefined) {
				return;
			} else if (shouldAct("eager")) {
				prefetchRoute(props.href, shouldPreload("eager"));
			} else if (inView && shouldAct("viewport")) {
				prefetchRoute(props.href, shouldPreload("viewport"));
			} else if (inView && shouldAct("idle")) {
				requestIdleCallback(() =>
					prefetchRoute(props.href!, shouldPreload("idle")),
				);
			}
		}, [inView, preloadRank, props.href, rank, shouldAct, shouldPreload]);

		return (
			<a
				{...props}
				ref={(el) => {
					a.current = el;

					if (typeof ref === "function") {
						ref(el);
					} else if (ref) {
						ref.current = el;
					}
				}}
				onClick={(e) => {
					onClick?.(e);
					if (!shouldHandleClick(e)) {
						return;
					}

					onNavigationStart?.();
					e.preventDefault();

					navigate(e.currentTarget.href, {
						data: historyState,
						replace: replaceState,
						scroll: !noScroll,
					})
						.then((completed) => {
							onNavigationEnd?.(completed);
						})
						.catch(() => {
							onNavigationEnd?.(false);
						});
				}}
				onMouseEnter={
					shouldAct("hover")
						? (e) => {
								onMouseEnter?.(e);
								if (!e.defaultPrevented) {
									prefetchRoute(props.href, shouldPreload("hover"));
								}
							}
						: onMouseEnter
				}
				onMouseDown={
					shouldAct("tap")
						? (e) => {
								onMouseDown?.(e);
								if (!e.defaultPrevented) {
									prefetchRoute(props.href, shouldPreload("tap"));
								}
							}
						: onMouseDown
				}
				onTouchStart={
					shouldAct("tap") || shouldAct("hover")
						? (e) => {
								onTouchStart?.(e);
								if (!e.defaultPrevented) {
									prefetchRoute(
										props.href,
										shouldPreload("tap") || shouldPreload("hover"),
									);
								}
							}
						: onTouchStart
				}
			/>
		);
	},
);

Link.displayName = "Link";

/** {@link StyledLink} props */
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
	metaKey: boolean;

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
		!e.metaKey &&
		(!t.target || t.target === "_self") &&
		!t.hasAttribute("download") &&
		!t.relList.contains("external")
	);
}

export type UseSubmitResult = {
	submitHandler(event: FormEvent<HTMLFormElement>): void;
} & (
	| UseMutationIdleResult
	| UseMutationLoadingResult
	| UseMutationErrorResult
	| UseMutationSuccessResult<any>
);

export type UseSubmitOptions = UseMutationOptions<
	any,
	{ form: HTMLFormElement; formData: FormData }
> &
	Omit<NavigationOptions, "actionData">;

// TODO: Where does this belong?
export function useSubmit(options?: UseSubmitOptions): UseSubmitResult {
	const { current } = useLocation();
	const pageContext = usePageContext();

	const mutation = useMutation<
		any,
		{ form: HTMLFormElement; formData: FormData }
	>(
		async ({ form, formData }) => {
			let body: FormData | URLSearchParams = formData;

			if (form.enctype === "application/x-www-form-urlencoded") {
				const entries = Array.from(formData.entries()).filter(
					([, v]) => typeof v === "string",
				) as Array<[string, string]>;
				body = new URLSearchParams(entries);
			}

			const response = await fetch(new URL(form.action ?? "", current), {
				method: "POST",
				body,
				headers: {
					"Content-Type": form.enctype || "application/x-www-form-urlencoded",
					Accept: "application/javascript",
				},
			});

			const text = await response.text();
			const value: ActionResult<any> = (0, eval)("(" + text + ")");

			return value;
		},
		{
			...options,
			onSuccess(value) {
				if ("redirect" in value) {
					navigate(value.redirect, {
						...options,
					}).catch(ignore);
				} else {
					options?.onSuccess?.(value.data);

					navigate(current, {
						replace: true,
						...options,
						actionData: value.data,
					}).catch(ignore);
				}
			},
		},
	);

	function submitHandler(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		mutation.mutate({
			form: e.currentTarget,
			formData: new FormData(e.currentTarget),
		});
	}

	mutation.data = mutation.data?.data ?? pageContext.actionData;

	const { data, error, isError, isIdle, isLoading, isSuccess, status } =
		mutation;

	return {
		submitHandler,
		data,
		error,
		isError,
		isIdle,
		isLoading,
		isSuccess,
		status,
	} as UseSubmitResult;
}

function ignore() {
	// Do nothing
}

export const prefetcher = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	prefetch(location: URL | string, preload: boolean) {
		// Do nothing until initialized
	},
};

/**
 * Preload a page's code and possibly data.
 *
 * @param location URL of the page to preload
 * @param preload Whether to also preload the data
 */
export function prefetchRoute(location?: URL | string, preload = false) {
	if (location === undefined) return;
	prefetcher.prefetch(location, preload);
}

function useInView<T extends HTMLElement>() {
	const ref = useRef<T | null>();
	const [inView, setInView] = useState(false);
	const observerRef = useRef<IntersectionObserver>();

	useEffect(() => {
		const { current } = ref;
		if (!current) {
			return;
		}

		if (!observerRef.current) {
			observerRef.current = new IntersectionObserver((entries) => {
				entries.forEach((entry) => setInView(entry.isIntersecting));
			});
		}

		const observer = observerRef.current;

		observer.observe(current);
		return () => observer.unobserve(current);
	});

	return { ref, inView };
}
