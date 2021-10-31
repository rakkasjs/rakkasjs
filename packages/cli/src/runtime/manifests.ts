import type { Route } from "rakkasjs/dist/server";

const API_ROUTES = "./api-routes.js";
const PAGE_ROUTES = "./page-routes.js";
const MANIFEST = "../rakkas-manifest.json";
const HTML_TEMPLATE = "../html-template.js";

/* eslint-disable @typescript-eslint/no-var-requires */
export const apiRoutes: Route[] = require(API_ROUTES).default;
export const pageRoutes: Route[] = require(PAGE_ROUTES).default;
export const manifest: Record<string, string[] | undefined> = require(MANIFEST);
export const htmlTemplate: string = require(HTML_TEMPLATE);
/* eslint-enable */
