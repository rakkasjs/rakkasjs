import { Plugin } from "vite";

export function preventViteBuild(): Plugin {
	let buildStepStartCalled = false;
	let prevent = false;

	return {
		name: "rakkasjs:prevent-vite-build",

		enforce: "pre",

		apply: "build",

		buildStepStart() {
			buildStepStartCalled = true;
		},

		configResolved(config) {
			if (
				config.buildSteps &&
				config.mode !== "multibuild" &&
				!buildStepStartCalled
			) {
				prevent = true;
			}
		},

		buildStart() {
			if (prevent) {
				throw new Error(
					"rakkas: Please use the 'rakkas' command instead of 'vite build' to build a Rakkas project.",
				);
			}
		},
	};
}
