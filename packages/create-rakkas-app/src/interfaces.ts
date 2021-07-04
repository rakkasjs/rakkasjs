export interface Defaults {
	availablePackageManagers: Array<"npm" | "yarn" | "pnpm">;
	defaults: Options;
}

export interface Options {
	packageManager: "npm" | "yarn" | "pnpm";
	features: {
		typescript: boolean;
		jest: boolean;
		eslint: boolean;
		stylelint: boolean;
		prettier: boolean;
	};
}
