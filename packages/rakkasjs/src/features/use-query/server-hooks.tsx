import React from "react";
import { CreateServerHooksFn } from "../../runtime/server-hooks";
import { SsrCacheContext } from "./implementation";
import devalue from "devalue";

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

		set(key: string, promise: Promise<any>) {
			this._items[key] = [promise];
			promise.then((value) => {
				this._items[key] = this._newItems[key] = [value];
				this._hasNewItems = true;
			});
		},

		subscribe() {
			throw new Error("Cannot subscribe on the server");
		},
	};

	return {
		wrapApp: (app) => {
			return (
				<SsrCacheContext.Provider value={cache}>{app}</SsrCacheContext.Provider>
			);
		},

		emitToDocumentHead() {
			const newItemsString = devalue(cache._getNewItems());
			return `<script>$RAKKAS_USE_QUERY_SSR_CACHE=${newItemsString}</script>`;
		},

		emitBeforeSsrChunk() {
			if (cache._hasNewItems) {
				const newItemsString = devalue(cache._getNewItems());
				return `<script>Object.assign($RAKKAS_USE_QUERY_SSR_CACHE,${newItemsString})</script>`;
			}

			return "";
		},
	};
};

export default createServerHooks;
