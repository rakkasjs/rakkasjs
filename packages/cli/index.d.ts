import { TransformOptions } from "@babel/core";
import { UserConfig } from "vite";

export function defineConfig(config: Config);

export interface FullConfig {
	/**
	 * File extensions for pages and layouts @default ["jsx", "tsx"] */
	pageExtensions: string[];

	/** Directory that contains pages and layouts @default "pages" */
	pagesDir: string;

	/** File extensions for endpoints and middleware @default ["js", "ts"] */
	endpointExtensions: string[];

	/** Directory that contains endpoints and middleware @default "api" */
	apiDir: string;

	/** Base URL for endpoints @default "/api" */
	apiRoot: string;

	/** Trust the x-forwarded-host and x-forwarded-proto headers in dev server.
	 * This is useful behind a reverse proxy. Set env variable TRUST_FORWARDED_ORIGIN to
	 * a non-empty string if you want the same in production.
	 * @default false */
	trustForwardedOrigin: boolean;

	/** Vite configuration (not all options are supported) */
	vite: UserConfig;

	/** Babel options passed to Vite's React plugin */
	babel: TransformOptions;
}

export type Config = Partial<FullConfig>;
