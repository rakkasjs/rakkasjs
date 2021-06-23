import { sortRoutes } from "./sortRoutes";

export type ModuleMap = Record<string, () => Promise<unknown>>;

export interface RawRoutes {
	wrappers: ModuleMap;
	leaves: ModuleMap;
	dir: string;
}

export function prepareRoutes({ wrappers, leaves, dir }: RawRoutes) {
	const LAYOUT_REGEXP = new RegExp(`^\\/${dir}\\/((.+)[./])?layout\\.`);
	const PAGE_REGEXP = new RegExp(`^\\/${dir}\\/((.+)[./])?page\\.`);

	// Sort wrappers (i.e. layouts or middleware)
	const sortedWrappers = Object.entries(wrappers)
		.map(([id]) => {
			const name = "/" + (id.match(LAYOUT_REGEXP)![2] || "");

			return {
				id,
				name,
				segments: name.split("/").filter(Boolean),
			};
		})
		.sort((a, b) => {
			// First if more segments
			const lenDif = b.segments.length - a.segments.length;
			if (lenDif) return lenDif;

			return a.name.localeCompare(b.name);
		});

	// Sort leaves (i.e. pages or endpoints)
	const sortedLeaves = sortRoutes(
		Object.entries(leaves).map(([id]) => {
			const name = "/" + (id.match(PAGE_REGEXP)![2] || "");

			return {
				pattern: name,
				content: [
					...sortedWrappers
						.filter((w) => {
							const res =
								name === w.name ||
								name.startsWith(w.name === "/" ? "/" : w.name + "/");
							return res;
						})
						.map((x) => x.id),
					id,
				],
			};
		}),
	);

	return {
		leaves: sortedLeaves,
		wrappers: sortedWrappers,
	};
}
