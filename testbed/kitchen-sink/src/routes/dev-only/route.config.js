// @ts-check
/** @type {import("rakkasjs").DirectoryConfig} */
export default (cfg) => ({
	disabled: cfg.command === "build",
});
