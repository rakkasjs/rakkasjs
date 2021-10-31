import type { Route } from "rakkasjs/dist/server";

/* eslint-disable @typescript-eslint/no-var-requires */
export const apiRoutes: Route[] = require("$output/api-routes.js").default;
export const pageRoutes: Route[] = require("$output/page-routes.js").default;
export const manifest: Record<
	string,
	string[] | undefined
> = require("$output/rakkas-manifest.json");
export const htmlTemplate: string = require("$output/html-template.js");
/* eslint-enable */
