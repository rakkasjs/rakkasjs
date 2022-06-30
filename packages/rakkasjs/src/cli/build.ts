import { BuildOptions, ResolvedConfig } from "vite";
import multibuild from "@vavite/multibuild";
import { version } from "../../package.json";
import pico from "picocolors";
import { doPrerender } from "./prerender";
import { cleanOptions, GlobalCLIOptions } from ".";

export async function build(
	root: string,
	options: BuildOptions & GlobalCLIOptions,
) {
	const buildOptions: BuildOptions = cleanOptions(options);

	let config: ResolvedConfig;
	let total: number;
	let paths: string[];

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

				total = config.buildSteps?.length || 1;
				paths = (config as any).api?.rakkas?.prerender || [];
				if (paths.length) {
					total += 1;
				}
			},

			onStartBuildStep(info) {
				logStep(info.currentStepIndex + 1, "Building " + info.currentStep.name);
			},
		},
	);

	if (paths!.length) {
		logStep(total!, "Prerendering static routes");
		await doPrerender(config!);
	}
}
