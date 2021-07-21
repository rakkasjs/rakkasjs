import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useLayoutEffect,
} from "react";
import { RouterContext } from "./useRouter";

const scrollHistory: Array<{ left: number; top: number } | undefined> = [];
let notify = (options?: { scroll?: boolean; focus?: boolean }) => {
	void options;
};

/**
 * Navigate programmatically
 * @param to URL to go to or an integer (-1 means back one page, 1 means forward one page)
 * @returns true if client-side navigation could be achieved
 */
export function navigate(
	to: string | number,
	options?: { replace?: boolean; scroll?: boolean; focus?: boolean },
) {
	if (typeof to === "number") {
		window.history.go(to);
	} else {
		const url = new URL(to, window.location.href);

		if (
			// Different origin
			url.origin !== window.location.origin ||
			// Hash change only
			(url.pathname === window.location.pathname &&
				url.search === window.location.search &&
				url.hash !== window.location.hash)
		) {
			// Let the browser handle it
			window.location.assign(to);
			return false;
		}

		const index = window.history.state?.index ?? window.history.length - 1;
		if (options?.replace) {
			if (options.scroll) scrollHistory[index] = undefined;
			window.history.replaceState(undefined, "", to);
		} else {
			scrollHistory.length = index + 1;
			window.history.pushState(undefined, "", to);
		}

		notify(options || { scroll: true, focus: true });
	}

	return true;
}

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
		content: ReactNode;
		hardReload?: string;
	}

	const [{ current, content, hardReload }, setState] = useState<RouterState>({
		current: new URL(window.location.href),
		content: children,
	});

	const [updateCounter, setUpdateCounter] = useState(0);
	const forceUpdate = useCallback(() => {
		setUpdateCounter((old) => (old + 1) & 0xfffffff);
	}, []);

	const [navigateOptions, setNavigateOptions] = useState({
		scroll: false,
		focus: false,
	});

	useEffect(() => {
		const saved = notify;

		notify = ({ scroll = true, focus = true } = {}) => {
			setNavigateOptions({ scroll, focus });
			forceUpdate();
		};

		return () => {
			notify = saved;
		};
	}, [forceUpdate]);

	const href = window.location.href;
	const skipRender = updateCounter === 0 && skipInitialRender;

	useEffect(() => {
		if (skipRender) return;

		if (hardReload) {
			window.location.href = hardReload;
			return;
		}

		const abortController = new AbortController();

		async function callRender() {
			if (abortController.signal.aborted) {
				return;
			}

			const next = new URL(href);

			const result = await render({
				url: next,
				abortSignal: abortController.signal,
				rerender() {
					forceUpdate();
				},
			});

			if (abortController.signal.aborted) {
				return;
			}

			if (result === null) {
				window.history.back();
			}

			setState((old) => {
				return {
					...old,
					current: next,
					content: result,
					hardReload: result === null ? href : undefined,
				};
			});
		}

		callRender();

		return () => {
			abortController.abort();
		};
	}, [forceUpdate, hardReload, render, href, skipRender, updateCounter]);

	useEffect(() => {
		function handleScroll() {
			const index = window.history.state?.index ?? window.history.length - 1;
			scrollHistory[index] = {
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

		if (navigateOptions.scroll || navigateOptions.focus) {
			requestAnimationFrame(() => {
				if (navigateOptions.scroll) {
					const index =
						window.history.state?.index ?? window.history.length - 1;

					if (unmounted) return;

					if (current.hash && current.hash !== "#") {
						const element = document.getElementById(current.hash.slice(1));
						if (element) {
							element.scrollIntoView();
						} else {
							window.scrollTo(scrollHistory[index] || { left: 0, top: 0 });
						}
					} else {
						window.scrollTo(scrollHistory[index] || { left: 0, top: 0 });
					}
				}

				if (navigateOptions.focus) {
					const focusTarget = document.querySelector(
						'button[autofocus], a[autofocus], input[autofocus]:not([type="hidden"]), select[autofocus], textarea[autofocus], [tabindex][autofocus]:not([tabindex="-1"])',
					) as HTMLElement | null;

					if (focusTarget) {
						focusTarget.focus();
					} else {
						(document.activeElement as HTMLElement | null)?.blur();
					}
				}
			});
		}

		return () => {
			unmounted = true;
		};
	}, [current, navigateOptions.focus, navigateOptions.scroll, href]);

	useEffect(() => {
		function handlePopState() {
			if (!window.history.state) {
				window.history.replaceState({ index: window.history.length }, "");
			}

			setNavigateOptions({ scroll: true, focus: true });
			forceUpdate();
		}

		window.addEventListener("popstate", handlePopState);
		window.history.scrollRestoration = "manual";

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [forceUpdate]);

	const contextValue = useMemo<RouterInfo>(() => {
		return {
			current,
			next: current.href !== href ? new URL(href) : undefined,
			navigate,
		};
		// current.href and next?.href covers current and next
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [current.href, href, navigate]);

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
}
