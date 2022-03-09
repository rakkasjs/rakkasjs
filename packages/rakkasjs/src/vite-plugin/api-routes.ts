import { Plugin } from "vite";
// import micromatch from "micromatch";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp } from "./util/route-to-reg-exp";

export function apiRoutes(): Plugin {
	const extPattern = "mjs|js|ts|jsx|tsx";

	const endpointPattern = `/**/*.api.(${extPattern})`;
	const middlewarePattern = `/**/middleware.(${extPattern})`;

	let root: string;
	// let isMiddleware: (filename: string) => boolean;
	// let isEndpoint: (filename: string) => boolean;

	async function generateRoutesModule(): Promise<string> {
		const endpointFiles = await glob(root + endpointPattern);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const middlewareFiles = await glob(root + middlewarePattern);

		let out = "";

		for (const [i, endpointFile] of endpointFiles.entries()) {
			out += `const e${i} = () => import(${JSON.stringify(endpointFile)});\n`;
		}

		out += "\nexport default [\n";

		for (const [i, endpointFile] of endpointFiles.entries()) {
			const relName = path.relative(root, endpointFile);
			const baseName = /^(.*)\.api\.(.*)$/.exec(relName)![1];
			out += `  [${routeToRegExp("/" + baseName)}, [e${i}]],\n`;
		}

		out += "]";

		return out;
	}

	return {
		name: "rakkasjs:endpoint-router",

		resolveId(id) {
			if (id === "virtual:rakkasjs:api-routes") {
				return id;
			}
		},

		async load(id) {
			if (id === "virtual:rakkasjs:api-routes") {
				return generateRoutesModule();
			}
		},

		configResolved(config) {
			root = config.root + "/src/routes";
			// isMiddleware = micromatch.matcher(endpointPattern);
			// isEndpoint = micromatch.matcher(middlewarePattern);
		},
	};
}
