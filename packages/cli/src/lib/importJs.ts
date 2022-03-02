import { normalizePath } from "vite";

/**
 * Wrapper function of dynamic import to ensure normalizing the path
 */
export async function importJs(path: string): Promise<any> {
	const normalizedPath = normalizePath(path);
	return await (0, eval)(
		`import(${JSON.stringify(
			normalizedPath.startsWith("/") ? normalizedPath : "/" + normalizedPath,
		)})`,
	);
}
