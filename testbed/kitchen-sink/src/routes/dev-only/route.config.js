// @ts-check
/** @type {import("rakkasjs").RouteConfigExport} */
export default (cfg) => ({
	disabled: cfg.command === "build",
});
