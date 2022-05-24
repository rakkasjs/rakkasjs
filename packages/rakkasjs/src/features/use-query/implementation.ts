import { createContext } from "react";

export interface SsrCache {
	get(key: string): CacheItem | undefined;
	set(key: string, value: Promise<any>): void;
	subscribe(key: string, fn: () => void): () => void;
}

export type CacheItem = [
	value: any,
	subscribers?: Set<() => void>,
	promise?: Promise<any>,
];

export const SsrCacheContext = createContext<SsrCache>(undefined as any);
