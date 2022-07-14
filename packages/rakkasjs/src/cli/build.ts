import { BuildOptions, ResolvedConfig } from "vite";
import multibuild from "@vavite/multibuild";
import { version } from "../../package.json";
import pico from "picocolors";
import { doPrerender } from "./prerender";
import { cleanOptions, GlobalCLIOptions } from ".";
import { RakkasAdapter } from "../vite-plugin/adapters";

export async function build(
	root: string,
	options: BuildOptions & GlobalCLIOptions,
) {
	const buildOptions: BuildOptions = cleanOptions(options);

	let config: ResolvedConfig;
	let total: number;
	let viteSteps: number;
	let paths: string[];
	let adapter: RakkasAdapter;

	function logStep(index: number, name: string) {
		config.logger.info(
			"\n" +
				pico.magenta("rakkas") +
				": " +
				name +
				" (" +
				pico.green(`${index}/${total}`) +
				")",
		);
	}

	await multibuild(
		{
			root,
			base: options.base,
			mode: options.mode,
			configFile: options.config,
			logLevel: options.logLevel,
			clearScreen: options.clearScreen,
			build: buildOptions,
		},
		{
			onInitialConfigResolved(resolvedConfig) {
				config = resolvedConfig;
				config.logger.info(
					pico.black(pico.bgMagenta(" Rakkas ")) +
						" " +
						pico.magenta(version) +
						" 💃",
				);

				total = viteSteps = config.buildSteps?.length || 1;
				paths = (config as any).api?.rakkas?.prerender || [];
				if (paths.length) {
					total += 1;
				}
				adapter = (config as any).api?.rakkas?.adapter as RakkasAdapter;
				if (adapter.bundle) {
					total += 1;
				}
			},

			onStartBuildStep(info) {
				logStep(info.currentStepIndex + 1, "Building " + info.currentStep.name);
			},
		},
	);

	let step = viteSteps! + 1;

	if (paths!.length) {
		logStep(step++, "Prerendering static routes");
		await doPrerender(config!);
	}

	if (adapter!.bundle) {
		logStep(step++, `Bundling for ${adapter!.name}`);
		await adapter!.bundle(config!.root);
	}
}
