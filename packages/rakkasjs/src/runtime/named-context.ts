import { createContext, Context } from "react";

/**
 * Creates a React context and saves it in the global object to work around
 * server-side HMR issues.
 */
export function createNamedContext<T>(
	name: string,
	defaultValue: T,
): Context<T> {
	if (process.env.NODE_ENV === "production") {
		return createContext(defaultValue);
	}

	name = `__rakkasjs_context_${name}__`;

	const existing = (globalThis as any)[name];
	if (existing) {
		return existing;
	}

	const context = createContext(defaultValue);
	(globalThis as any)[name] = context;

	return context;
}
