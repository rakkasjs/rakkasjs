import React from "react";
import { CreateServerHooksFn } from "../server-hooks";
import { SsrCacheContext } from "../../lib/use-query/use-query";

const createServerHooks: CreateServerHooksFn = () => {
	const cache = {
		_items: Object.create(null) as Record<string, any>,

		_newItems: Object.create(null) as Record<string, any>,

		_hasNewItems: false,

		_getNewItems() {
			const items = this._newItems;
			this._newItems = Object.create(null);
			this._hasNewItems = false;
			return items;
		},

		get(key: string) {
			return this._items[key];
		},

		set(key: string, value: any) {
			this._items[key] = value;
			this._newItems[key] = value;
			this._hasNewItems = true;
		},
	};

	return {
		wrapApp: (app) => {
			return (
				<SsrCacheContext.Provider value={cache}>{app}</SsrCacheContext.Provider>
			);
		},

		emitToDocumentHead() {
			return `<script>$RAKKAS_USE_QUERY_SSR_CACHE=Object.create(null);</script>`;
		},

		emitBeforeSsrChunk() {
			if (cache._hasNewItems) {
				const newItemsString = escapedJson(cache._getNewItems());
				return `<script>Object.assign($RAKKAS_USE_QUERY_SSR_CACHE,${newItemsString})</script>`;
			}

			return "";
		},
	};
};

export default createServerHooks;

// TODO: Dedupe these
function escapedJson(json: any): string {
	return JSON.stringify(json).replace(/</g, "\\u003c");
}
