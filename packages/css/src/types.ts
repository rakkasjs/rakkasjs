import type {} from "rakkasjs";

declare module "rakkasjs" {
	interface RequestContext {
		rakkas: {
			css: {
				names: Map<string, string>;
				newNames: Map<string, string>;
				rules: string[];
				counter: number;
			};
		};
	}

	interface RakkasBrowserGlobal {
		css: Map<string, string>;
	}
}
