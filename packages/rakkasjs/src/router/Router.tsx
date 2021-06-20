import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	createContext,
	useContext,
	useRef,
	useLayoutEffect,
} from "react";

export interface RouterProps {
	/** Callback for rendering the view for a given URL */
	render(renderArgs: RouteRenderArgs): ReactNode | Promise<ReactNode>;
	/** Don't call render in initial render. Useful for hydrating after SSR. */
	skipInitialRender?: boolean;
}

export interface RouteRenderArgs {
	/** URL for which a view should be rendered */
	url: URL;
	/** This is for signaling when the route transition is aborted */
	abortSignal: AbortSignal;
	/** Navigate */
	navigate(
		to: string,
		options?: {
			replace?: boolean;
			scroll?: boolean;
		},
	): void;
	/** Force a rerender */
	rerender(): void;
}

export const Router: FC<RouterProps> = ({
	children,
	render,
	skipInitialRender = false,
}) => {
	interface RouterState {
		current: URL;
		next?: URL;
		shouldScroll?: boolean;
		content: ReactNode;
	}

	const scrollHistory = useRef<
		Array<{ left: number; top: number } | undefined>
	>([]);

	const [{ current, next, shouldScroll, content }, setState] =
		useState<RouterState>({
			current: new URL(window.location.href),
			next: skipInitialRender ? undefined : new URL(window.location.href),
			content: children,
		});

	const navigate = useCallback(
		function navigate(
			to: string | number,
			options?: { replace?: boolean; scroll?: boolean },
		) {
			if (typeof to === "number") {
				window.history.go(to);
			} else {
				const url = new URL(to, current);

				if (url.origin !== current?.origin) {
					window.location.assign(to);
					return false;
				}

				if (
					url.pathname === current.pathname &&
					url.search === current.search &&
					url.hash !== current.hash
				) {
					window.location.assign(to);
					return false;
				}

				const index = window.history.state?.index ?? window.history.length - 1;
				if (options?.replace) {
					if (options.scroll) scrollHistory.current[index] = undefined;
					window.history.replaceState(undefined, "", to);
				} else {
					scrollHistory.current.length = index + 1;
					window.history.pushState(undefined, "", to);
				}

				setState((old) => ({
					...old,
					next: url,
					shouldScroll: options?.scroll ?? true,
				}));
			}

			return true;
		},
		[current],
	);

	useEffect(() => {
		if (!next) return;

		const abortController = new AbortController();

		const renderResult = render({
			url: next,
			abortSignal: abortController.signal,
			navigate(to, options) {
				navigate(to, options);
				abortController.abort();
			},
			rerender() {
				setState((old) => ({ ...old, next: old.current }));
			},
		});

		if (isPromise(renderResult)) {
			renderResult.then((result) => {
				if (abortController.signal.aborted) return;
				setState((old) => ({
					...old,
					current: next,
					next: undefined,
					content: result,
				}));
			});
		} else {
			setState((old) => ({
				...old,
				current: next,
				next: undefined,
				content: renderResult,
			}));
		}

		return () => {
			abortController.abort();
		};
	}, [render, next, navigate]);

	useEffect(() => {
		function handleScroll() {
			const index = window.history.state?.index ?? window.history.length - 1;
			scrollHistory.current[index] = {
				left: window.scrollX,
				top: window.scrollY,
			};
		}

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	});

	useLayoutEffect(() => {
		let unmounted = false;

		if (window.history.state?.index === undefined) {
			window.history.replaceState({ index: window.history.length - 1 }, "");
		}

		if (shouldScroll && !next) {
			const index = window.history.state?.index ?? window.history.length - 1;

			requestAnimationFrame(() => {
				if (unmounted) return;

				if (current.hash && current.hash !== "#") {
					const element = document.getElementById(current.hash.slice(1));
					if (element) {
						element.scrollIntoView();
					} else {
						window.scrollTo(
							scrollHistory.current[index] || { left: 0, top: 0 },
						);
					}
				} else {
					console.log("current.hash", current.hash);
					window.scrollTo(scrollHistory.current[index] || { left: 0, top: 0 });
				}
			});

			return () => {
				unmounted = true;
			};
		}
	}, [current, shouldScroll, next]);

	useEffect(() => {
		function handlePopState() {
			if (!window.history.state) {
				window.history.replaceState({ index: window.history.length }, "");
			}

			setState((old) => ({
				...old,
				next: new URL(window.location.href),
				shouldScroll: true,
			}));
		}

		window.addEventListener("popstate", handlePopState);
		window.history.scrollRestoration = "manual";

		() => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, []);

	const contextValue = useMemo<RouterInfo>(
		() => ({
			current,
			next,
			navigate,
		}),
		[current, navigate, next],
	);

	return (
		<RouterContext.Provider value={contextValue}>
			{content}
		</RouterContext.Provider>
	);
};

export interface ServerRouterProps {
	url: URL;
}

export const ServerRouter: FC<ServerRouterProps> = ({ children, url }) => {
	const contextValue = useMemo<RouterInfo>(
		() => ({
			current: url,
			navigate() {
				throw new Error("navigate() cannot be used on server side");
			},
		}),
		[url],
	);

	return (
		<RouterContext.Provider value={contextValue}>
			{children}
		</RouterContext.Provider>
	);
};

export interface RouterInfo {
	/** Route that is currently viewed */
	current: URL;
	/** Route to which a transition is underway */
	next?: URL;
	/**
	 * Navigate programmatically
	 * @param to URL to go to or an integer (-1 means back one page, 1 means forward one page)
	 * @returns true if client-side navigation could be achieved
	 */
	navigate(
		to: string | number,
		options?: {
			/** Replace current history entry instead of pushing a new one @default false */
			replace?: boolean;
			/** Restore scroll position for scroll to the top/URL hash @default true */
			scroll?: boolean;
		},
	): boolean;
}

const RouterContext = createContext<RouterInfo>({
	current: new URL("https://example.com"),
	navigate() {
		throw new Error("navigate() called outside of <Router />");
	},
});

/** Custom hook for tracking navigation status and programmatic navigation */
export function useRouter(): RouterInfo {
	return useContext(RouterContext);
}

function isPromise(value: unknown): value is Promise<unknown> {
	return typeof (value as Promise<ReactNode>).then === "function";
}
