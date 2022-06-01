import React from "react";
import { CreateServerHooksFn } from "../../runtime/server-hooks";
import { CacheItem, QueryCacheContext } from "./implementation";
import devalue from "devalue";

const createServerHooks: CreateServerHooksFn = () => {
	const cache = {
		_items: Object.create(null) as Record<string, any>,

		_newItems: Object.create(null) as Record<string, any>,

		_hasNewItems: false,

		_errorItems: Object.create(null) as Record<string, unknown>,

		_getNewItems() {
			const items = this._newItems;
			this._newItems = Object.create(null);
			this._hasNewItems = false;
			return items;
		},

		has(key: string) {
			return key in this._items;
		},

		get(key: string): CacheItem | undefined {
			if (key in this._errorItems) {
				throw this._errorItems[key];
			}

			if (!this.has(key)) {
				return undefined;
			}

			const content = this._items[key];
			const result =
				content instanceof Promise ? { promise: content } : { value: content };

			return result as any;
		},

		set(key: string, valueOrPromise: Promise<any>) {
			this._items[key] = valueOrPromise;
			if (valueOrPromise instanceof Promise) {
				valueOrPromise.then(
					(value) => {
						this._items[key] = this._newItems[key] = value;
						this._hasNewItems = true;
					},
					(error) => {
						delete this._items[key];
						this._errorItems[key] = error;
					},
				);
			} else {
				this._newItems[key] = valueOrPromise;
				this._hasNewItems = true;
			}
		},

		subscribe() {
			throw new Error("Cannot subscribe on the server");
		},
	};

	return {
		wrapApp: (app) => {
			return (
				<QueryCacheContext.Provider value={cache}>
					{app}
				</QueryCacheContext.Provider>
			);
		},

		emitToDocumentHead() {
			const newItemsString = devalue(cache._getNewItems());
			return `<script>$RSC=${newItemsString}</script>`;
		},

		emitBeforeSsrChunk() {
			if (cache._hasNewItems) {
				const newItemsString = devalue(cache._getNewItems());
				return `<script>Object.assign($RSC,${newItemsString})</script>`;
			}
		},
	};
};

export default createServerHooks;
