import React from "react";
import { definePage } from "rakkasjs";

definePage({
	// Return url.pathname as the cache key
	getCacheKey: ({ url }) => url.pathname,

	// This will now only be called when url.pathname changes.
	// It won't be called when url.search changes.
	load() {
		return { data: undefined };
	},

	Component: function PageWithCustomCacheKey() {
		return <p>...</p>;
	},
});
