export * from "./lib/types";

import { StyledLink } from "knave-react";

export {
	navigate,
	Link,
	StyledLink,
	useCurrentLocation,
	usePendingLocation,
	useNavigationState,
	useNavigationBlocker,
} from "knave-react";

/** @deprecated Use StyledLink */
export const NavLink = StyledLink;

export { useRouter } from "./lib/useRouter";

import {
	PageTypes,
	DefaultPageTypes,
	LayoutTypes,
	DefaultLayoutTypes,
	GetCacheKeyFunc,
	PageLoadFunc,
	LayoutLoadFunc,
	Page,
	ErrorPage,
	Layout,
	SimpleLayout,
	ClientHooks,
	CommonHooks,
	PageOptions,
	LayoutOptions,
} from "./lib/types";

export { setRootContext } from "./root-context";

// canHandleErrors missing or false => normal page
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: Page<T>;
	options?: PageOptions & {
		canHandleErrors?: false;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: Page<T>;
	options?: PageOptions;
};

// canHandleErrors true => error handling page
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T>;
	options: PageOptions & {
		canHandleErrors: true;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T>;
	options: PageOptions;
};

// Implementation
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T> | Page<T>;
	options?: PageOptions;
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T> | Page<T>;
	options?: PageOptions;
} {
	if (import.meta.hot && !import.meta.env.SSR) {
		// Register for React refresh
		(window as any).$RefreshReg$(def.Component, def.Component.name);
	}
	return def;
}

// canHandleErrors missing or true && render function present => normal layout
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: Layout<T>;
	options?: LayoutOptions & {
		canHandleErrors?: true;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: Layout<T>;
	options?: LayoutOptions;
};

// render missing => candHandleErrors cannot be true
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: never;
	options?: LayoutOptions & {
		canHandleErrors?: false;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	options?: LayoutOptions;
};

// canHandleErrors = false => simple layout
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: SimpleLayout<T>;
	options?: LayoutOptions & {
		canHandleErrors?: false;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: SimpleLayout<T>;
	options: LayoutOptions;
};

// Implementation
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: Layout<T> | SimpleLayout<T>;
	options?: LayoutOptions;
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: Layout<T> | SimpleLayout<T>;
	options?: LayoutOptions;
} {
	if (import.meta.hot && !import.meta.env.SSR && def.Component) {
		// Register for React refresh
		(window as any).$RefreshReg$(def.Component, def.Component.name);
	}

	return def;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}

export function defineCommonHooks(hooks: CommonHooks): CommonHooks {
	return hooks;
}
