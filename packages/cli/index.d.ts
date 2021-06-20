import { UserConfig } from "vite";

export function defineConfig(config: Config);

export interface FullConfig {
	/** File extensions for pages and layouts @default ["jsx", "tsx"] */
	pageExtensions: string[];
	/** Directory that contains pages and layouts @default "pages" */
	pagesDir: string;
	/** File extensions for endpoints and middleware @default ["js", "ts"] */
	endpointExtensions: string[];
	/** Directory that contains endpoints and middleware @default "api" */
	apiDir: string;
	/** Base URL for endpoints @default "/api" */
	apiRoot: string;
	/** Vite configuration (not all options are supported)*/
	vite: UserConfig;
}

export type Config = Partial<FullConfig>;
