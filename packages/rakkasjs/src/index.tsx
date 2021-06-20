export * from "./types";

export { Router } from "./router/Router";
export { Link } from "./router/Link";
export { NavLink } from "./router/NavLink";

export { useRakkas } from "./useRakkas";

import {
	PageTypes,
	LayoutTypes,
	GetCacheKeyFunc,
	PageLoadFunc,
	LayoutLoadFunc,
	Page,
	ErrorPage,
	Layout,
	SimpleLayout,
} from "./types";

// canHandleErrors missing or false => normal page
export function definePage<T extends PageTypes = PageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: Page<T>;
	options?: {
		canHandleErrors?: boolean;
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
export function definePage<T extends PageTypes = PageTypes>(def: {
	getCacheKey?: GetCacheKeyFunc<T>;
	load?: PageLoadFunc<T>;
	Component: ErrorPage<T>;
	options?: {
		canHandleErrors?: boolean;
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
export function definePage<T extends PageTypes = PageTypes>(def: {
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
	return def;
}

// canHandleErrors missing or true && render function present => normal layout
export function defineLayout<T extends LayoutTypes = LayoutTypes>(def: {
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
export function defineLayout<T extends LayoutTypes = LayoutTypes>(def: {
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
export function defineLayout<T extends LayoutTypes = LayoutTypes>(def: {
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
export function defineLayout<T extends LayoutTypes = LayoutTypes>(def: {
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
	return def;
}
