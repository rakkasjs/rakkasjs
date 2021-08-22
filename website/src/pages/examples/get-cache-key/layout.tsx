import React from "react";
import { defineLayout } from "rakkasjs";

defineLayout({
	// Return url.pathname as the cache key
	getCacheKey: ({ url }) => url.pathname,

	// This will now be called when url.pathname changes.
	load() {
		return { data: undefined };
	},

	Component: function LayoutWithCustomCacheKey() {
		return <p>...</p>;
	},
});
