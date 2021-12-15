export * from "./lib/types";

export {
	navigate,
	Link,
	StyledLink as NavLink,
	useCurrentLocation,
	usePendingLocation,
	useNavigationState,
	useNavigationBlocker,
} from "knave-react";
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
} from "./lib/types";

export { setRootContext } from "./root-context";

// canHandleErrors missing or false => normal page
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: Page<T>;
	options?: {
		canHandleErrors?: false;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: Page<T>;
	options?: {
		canHandleErrors?: false;
	};
};

// canHandleErrors true => error handling page
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T>;
	options: {
		canHandleErrors: true;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T>;
	options: {
		canHandleErrors: true;
	};
};

// Implementation
export function definePage<T extends PageTypes = DefaultPageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T> | Page<T>;
	options?: {
		canHandleErrors?: boolean;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T> | Page<T>;
	options?: {
		canHandleErrors?: boolean;
	};
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
	options?: {
		canHandleErrors?: true;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: Layout<T>;
	options?: {
		canHandleErrors?: false;
	};
};

// render missing => candHandleErrors cannot be true
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: never;
	options?: {
		canHandleErrors?: false;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	options?: {
		canHandleErrors?: false;
	};
};

// canHandleErrors = false => simple layout
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: SimpleLayout<T>;
	options?: {
		canHandleErrors?: boolean;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component: SimpleLayout<T>;
	options: {
		canHandleErrors: false;
	};
};

// Implementation
export function defineLayout<T extends LayoutTypes = DefaultLayoutTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: Layout<T> | SimpleLayout<T>;
	options?: {
		canHandleErrors?: boolean;
	};
}): {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: LayoutLoadFunc<T>;
	Component?: Layout<T> | SimpleLayout<T>;
	options?: {
		canHandleErrors?: boolean;
	};
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
