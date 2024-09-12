import { webcrypto } from "node:crypto";
import fs from "node:fs";

export function createCache<T>(cache: Cache<T>) {
	const lock: Lock = new InProcessLock();

	return async function withCache(
		key: string,
		fetcher: () => Promise<T>,
		isCacheable: (data: T) => boolean,
	) {
		return lock.withLock(key, async () => {
			const cached = await cache.get(key);
			if (cached) {
				return cached;
			}

			const data = await fetcher();
			if (isCacheable(data)) {
				await cache.put(key, data);
			}

			return data;
		});
	};
}

export interface Lock {
	withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

export interface Cache<T> {
	get(key: string): Promise<T | undefined>;
	put(key: string, data: T): Promise<void>;
}

export class InProcessLock implements Lock {
	#locks = new Map<string, Promise<void>>();

	async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
		let lock: Promise<void> | undefined;
		while ((lock = this.#locks.get(key))) {
			await lock;
		}

		const promise = fn();
		this.#locks.set(
			key,
			promise.then(returnUndefined, returnUndefined).finally(() => {
				this.#locks.delete(key);
			}),
		);

		return promise;
	}
}

export class FsCache<T> implements Cache<T> {
	#cacheDir: string;
	#serialize: (data: T) => Buffer;
	#deserialize: (buffer: Buffer) => T;

	constructor(
		cacheDir: string,
		serialize: (data: T) => Buffer,
		deserialize: (buffer: Buffer) => T,
	) {
		this.#cacheDir = cacheDir;
		this.#serialize = serialize;
		this.#deserialize = deserialize;
	}

	async get(key: string) {
		const path = `${this.#cacheDir}/${encodeURIComponent(key)}`;
		let data: Buffer | undefined;
		try {
			data = await fs.promises.readFile(path + ".cache");
		} catch (error: any) {
			if (error && error.code === "ENOENT") {
				return undefined;
			}

			throw error;
		}

		return this.#deserialize(data);
	}

	async put(key: string, data: T) {
		// Write to temporary file first
		const path = `${this.#cacheDir}/${encodeURIComponent(key)}`;
		const tmpPath = `${path}-${webcrypto.randomUUID()}.tmp`;
		await fs.promises.writeFile(tmpPath, this.#serialize(data));
		await fs.promises.rename(tmpPath, path + ".cache");
	}
}

const returnUndefined = () => undefined;
