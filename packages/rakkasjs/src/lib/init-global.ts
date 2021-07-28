export function initGlobal<T>(name: string, value: T): T {
	name = "$rakkas$" + name;

	if (import.meta.env.DEV) {
		return (globalThis as any)[name] === undefined
			? ((globalThis as any)[name] = value)
			: (globalThis as any)[name];
	} else {
		return value;
	}
}

export function initClientGlobal<T>(
	name: string,
	value: T,
	ssrValue: T = value,
): T {
	name = "$rakkas$" + name;
	if (import.meta.env.DEV) {
		if (import.meta.env.SSR) {
			return ssrValue;
		} else {
			return (globalThis as any)[name] === undefined
				? ((globalThis as any)[name] = value)
				: (globalThis as any)[name];
		}
	} else {
		return value;
	}
}

export function setGlobal<T>(name: string, value: T) {
	name = "$rakkas$" + name;

	if (import.meta.env.DEV) {
		return ((globalThis as any)[name] = value);
	} else {
		return value;
	}
}
