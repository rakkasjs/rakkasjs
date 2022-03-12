import { createContext } from "react";

export interface SsrCache {
	get(key: string): CacheItem | undefined;
	set(key: string, value: CacheItem): void;
}

export type CacheItem = [success: number, value: any];

export const SsrCacheContext = createContext<SsrCache>(undefined as any);
