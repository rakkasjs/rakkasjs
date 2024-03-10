import { startTransition, useContext, useSyncExternalStore } from "react";
import { findBlocker } from "./blocker";
import { setNextId } from "../../../runtime/App";
import { LocationContext } from "./link";
import { RenderedUrlContext } from "../../pages/contexts";

let lastRenderedId: string;
let lastRenderedHref: string;

let navigationPromise: Promise<void> | undefined;
export let navigationResolve: (() => void) | undefined;

export function initialize() {
	base().href = location.href;

	const id = createUniqueId();
	setHistoryEntry({ id }, location.href, true);
	setNavigationEntry(id, { index: 0, scrollX, scrollY });
	history.scrollRestoration = "manual";

	lastRenderedId = id;
	lastRenderedHref = location.href;

	addEventListener("popstate", handlePopState);
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
	const blocker = findBlocker();
	if (blocker) {
		blocker.redo = () => navigate(to, options);
		blocker.notify();
		return false;
	}

	const url = new URL(to, location.href);

	if (url.origin !== location.origin) {
		location.href = url.href;
		return new Promise<boolean>(() => {
			// Never resolves
		});
	}

	const { replace = false, data, actionData, scroll = true } = options || {};

	const historyEntry = getHistoryEntry();
	const navEntry = getNavigationEntry(historyEntry.id)!;
	let scrollGroupId: string | undefined;
	if (!scroll) {
		scrollGroupId = navEntry.scrollGroupId ??= createUniqueId();
	}

	// Save scroll position
	saveScrollPosition(historyEntry.id);

	const newId = createUniqueId();

	setNavigationEntry(newId, {
		index: navEntry.index + (replace ? 0 : 1),
		scrollGroupId,
	});

	setHistoryEntry({ id: newId, userData: data, actionData }, url.href, replace);

	return finishNavigation(newId);
}

let cancelling = false;
function handlePopState() {
	if (cancelling) {
		cancelling = false;
		return;
	}

	const blocker = findBlocker();
	if (blocker) {
		cancelling = true;
		const delta = cancelLastNavigation();
		blocker.redo = () => history.go(delta);
		blocker.notify();
		return false;
	}

	saveScrollPosition(lastRenderedId);
	const historyEntry = getHistoryEntry();
	finishNavigation(historyEntry.id).catch(console.error);
}

function finishNavigation(targetId: string) {
	const { promise, resolve } = Promise.withResolvers<void>();

	navigationPromise = promise;
	navigationResolve = resolve;

	startTransition(() => {
		setNextId(targetId);
	});

	listeners.forEach((listener) => listener());

	return navigationPromise!.then(() => {
		const complete = getHistoryEntry().id === targetId;
		if (complete) {
			lastRenderedId = getHistoryEntry().id;
			lastRenderedHref = location.href;
			base().href = location.href;
			listeners.forEach((listener) => listener());
		}

		return complete;
	});
}

function base(): HTMLBaseElement {
	const result = document.head.querySelector("base")!;
	if (result) return result;

	return document.head.insertBefore(
		document.createElement("base"),
		document.head.firstChild,
	);
}

function createUniqueId(): string {
	try {
		return crypto.randomUUID();
	} catch {
		return Math.random().toString(36).slice(2);
	}
}

interface HistoryEntry {
	id: string;
	userData?: any;
	actionData?: any;
}

function getHistoryEntry(): HistoryEntry {
	const entry = history.state;
	if (entry && typeof entry.id === "string") {
		return entry;
	}

	const lastNavEntry = getNavigationEntry(lastRenderedId)!;

	const newId = createUniqueId();
	setNavigationEntry(newId, {
		index: lastNavEntry.index + 1,
	});

	const newEntry: HistoryEntry = { id: newId };
	setHistoryEntry(newEntry, location.href, true);

	return newEntry;
}

function setHistoryEntry(entry: HistoryEntry, href: string, replace: boolean) {
	if (replace) {
		history.replaceState(entry, "", href);
	} else {
		history.pushState(entry, "", href);
	}
}

interface NavigationEntry {
	scrollGroupId?: string;
	index: number;
	scrollX?: number;
	scrollY?: number;
	elements?: Map<string, { x: number; y: number }>;
}

const memoryEntries = new Map<string, NavigationEntry>();

function setNavigationEntry(id: string, entry: NavigationEntry) {
	memoryEntries.set(id, entry);
	try {
		sessionStorage.setItem(`rakkas:nav:${id}`, JSON.stringify(entry));
	} catch {
		// Ignore
	}
}

function getNavigationEntry(id: string): NavigationEntry | undefined {
	const entry = memoryEntries.get(id);
	if (entry) {
		return entry;
	}

	try {
		const data = sessionStorage.getItem(`rakkas:nav:${id}`);
		if (!data) {
			return;
		}

		const parsed = JSON.parse(data);
		validatedNavigationEntry(parsed);
		memoryEntries.set(id, parsed);

		return parsed;
	} catch {
		// Ignore
	}
}

function validatedNavigationEntry(
	entry: any,
): asserts entry is NavigationEntry {
	if (
		!entry ||
		typeof entry !== "object" ||
		typeof entry.index !== "number" ||
		typeof entry.scrollX !== "number" ||
		typeof entry.scrollY !== "number" ||
		(entry.scrollGroupId !== undefined &&
			typeof entry.scrollGroupId !== "string")
	) {
		throw new Error("Invalid navigation entry");
	}
}

export function restoreScrollPosition() {
	const entry = getNavigationEntry(getHistoryEntry().id)!;

	if (
		lastSavedGroupId &&
		entry.scrollGroupId &&
		lastSavedGroupId === entry.scrollGroupId
	) {
		// Same group, don't restore
		return;
	}

	const { scrollX, scrollY } = entry;

	if (scrollX === undefined || scrollY === undefined) {
		if (location.hash) {
			const hashElement = document.querySelector(location.hash);
			if (hashElement) {
				hashElement.scrollIntoView();
			} else {
				scrollTo(0, 0);
			}
		} else {
			scrollTo(0, 0);
		}
	} else {
		scrollTo(scrollX, scrollY);
	}

	for (const el of document.querySelectorAll("[data-rakkas-scroll-id]")) {
		const id = el.getAttribute("data-rakkas-scroll-id")!;
		const pos = entry.elements?.get(id);
		if (pos) {
			el.scrollTo(pos.x, pos.y);
		} else {
			el.scrollTo(0, 0);
		}
	}
}

let lastSavedGroupId: string | undefined;
function saveScrollPosition(id: string) {
	const entry = getNavigationEntry(id)!;
	lastSavedGroupId = entry.scrollGroupId;

	const elements = new Map<string, { x: number; y: number }>();
	for (const el of document.querySelectorAll("[data-rakkas-scroll-id]")) {
		const id = el.getAttribute("data-rakkas-scroll-id")!;
		elements.set(id, { x: el.scrollLeft, y: el.scrollTop });
	}

	setNavigationEntry(id, {
		...entry,
		scrollX,
		scrollY,
		elements,
	});
}

const listeners = new Set<() => void>([() => {}]);

/** Return value of useLocation */
export interface UseLocationResult {
	/** The URL of the current page before any rewrites */
	current: URL;
	/** The URL of the current page after rewrites */
	rendered: URL;
	/** The URL of the page that is being navigated to, if any */
	pending?: URL;
}

export function useLocation(): UseLocationResult {
	const ssrLocation = useContext(LocationContext);

	const state = useSyncExternalStore(
		(onChange) => {
			listeners.add(onChange);
			return () => {
				listeners.delete(onChange);
			};
		},
		() => {
			const snapshot = JSON.stringify({
				current: lastRenderedHref,
				pending: location.href === lastRenderedHref ? undefined : location.href,
			});

			return snapshot;
		},
		() => {
			const ssrSnapshot = JSON.stringify({
				current: ssrLocation,
			});

			return ssrSnapshot;
		},
	);

	const parsed = JSON.parse(state) as { current: string; pending?: string };

	const rendered = useContext(RenderedUrlContext);

	return {
		current: new URL(parsed.current),
		rendered,
		pending: parsed.pending ? new URL(parsed.pending) : undefined,
	};
}

/** Cancel the last navigation. Returns a function to redo the navigation. */
export function cancelLastNavigation() {
	const last = getNavigationEntry(lastRenderedId)!.index;
	const next = getNavigationEntry(getHistoryEntry().id)!.index;
	const delta = last - next;
	history.go(delta);
	return -delta;
}

if (!import.meta.env.SSR) {
	rakkas.navigate = navigate;
}
