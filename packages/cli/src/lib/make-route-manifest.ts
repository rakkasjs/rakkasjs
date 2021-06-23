import glob from "fast-glob";
import { sortRoutes } from "./sortRoutes";

export interface RouteManifestConfig {
	srcDir: string;
	routesDir: string;
	wrapperExt: string;
	leafExt: string;
	finalExtensions: string;
	rootUrl: string;
}

export async function makeRouteManifest({
	srcDir,
	routesDir,
	wrapperExt,
	leafExt,
	finalExtensions,
	rootUrl,
}: RouteManifestConfig) {
	const leavesPattern = `/${routesDir}/**/(*.)?${leafExt}.(${finalExtensions})`;
	const wrappersPattern = `/${routesDir}/**/(*/)?${wrapperExt}.(${finalExtensions})`;

	const wrappers = (await glob(srcDir + wrappersPattern)).map((x) =>
		x.slice(srcDir.length),
	);

	const leaves = (await glob(srcDir + leavesPattern)).map((x) =>
		x.slice(srcDir.length),
	);

	const rapperRegexp = new RegExp(
		`^\\/${routesDir}\\/((.+)[./])?${wrapperExt}\\.`,
	);
	const leafRegexp = new RegExp(`^\\/${routesDir}\\/((.+)[./])?${leafExt}\\.`);

	const sortedWrappers = wrappers
		.map((id) => {
			const name = "/" + (id.match(rapperRegexp)![2] || "");

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
		leaves.map((id) => {
			const name = rootUrl + (id.match(leafRegexp)![2] || "");

			return {
				pattern: name,
				content: [
					id,
					...sortedWrappers
						.filter((w) => {
							const res =
								name === w.name ||
								name.startsWith(w.name === "/" ? "/" : w.name + "/");
							return res;
						})
						.map((x) => x.id),
				],
			};
		}),
	);

	let result = "";

	for (const [i, wrapper] of wrappers.entries()) {
		result += `const w${i}=()=>import(${JSON.stringify(wrapper)})\n`;
	}

	result += `export default [`;
	for (const leaf of sortedLeaves) {
		const [leafName, ...wrapperNames] = leaf.content;
		result += `[${leaf.regexp.toString()},${JSON.stringify(
			leaf.pattern,
		)},[${wrapperNames
			.map((w) => `w${wrappers.indexOf(w)},`)
			.reverse()
			.join("")}()=>import(${JSON.stringify(leafName)})]],`;
	}

	return result + "]";
}
