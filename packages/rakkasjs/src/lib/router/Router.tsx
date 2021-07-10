import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
	useLayoutEffect,
} from "react";
import { RouterContext } from "./useRouter";

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
		hardReload?: string;
	}

	const scrollHistory = useRef<
		Array<{ left: number; top: number } | undefined>
	>([]);

	const [{ current, next, shouldScroll, content, hardReload }, setState] =
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

		// eslint-disable-next-line react-hooks/exhaustive-deps
		[current.href],
	);

	useEffect(() => {
		if (hardReload) {
			window.location.href = hardReload;
			return;
		}

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
				setState((old) => {
					return { ...old, next: old.current };
				});
			},
		});

		if (isPromise(renderResult)) {
			renderResult.then((result) => {
				if (abortController.signal.aborted) return;

				if (result === null) {
					window.history.back();
				}

				setState((old) => ({
					...old,
					current: next,
					next: undefined,
					content: result,
					hardReload: result === null ? window.location.href : undefined,
				}));
			});
		} else {
			if (renderResult === null) {
				window.history.back();
			}

			setState((old) => ({
				...old,
				current: next,
				next: undefined,
				content: renderResult,
				hardReload: renderResult === null ? window.location.href : undefined,
			}));
		}

		return () => {
			abortController.abort();
		};
	}, [navigate, next, render, hardReload]);

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

	const contextValue = useMemo<RouterInfo>(() => {
		return {
			current,
			next,
			navigate,
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current.href, next?.href, navigate]);

	return (
		<RouterContext.Provider value={contextValue}>
			{content}
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

function isPromise(value: unknown): value is Promise<unknown> {
	return typeof (value as Promise<ReactNode>).then === "function";
}
