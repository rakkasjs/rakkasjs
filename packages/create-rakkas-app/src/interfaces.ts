export interface Defaults {
	availablePackageManagers: Array<"npm" | "yarn" | "pnpm">;
	defaults: Options;
}

export interface Options {
	packageManager: "npm" | "yarn" | "pnpm";
	features: {
		demo: boolean;
		typescript: boolean;
		jest: boolean;
		api: boolean;
		cypress: boolean;
		eslint: boolean;
		stylelint: boolean;
		prettier: boolean;
	};
}
