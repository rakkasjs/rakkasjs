import { UserConfig } from "vite";

export function defineConfig(config: Config);

export interface FullConfig {
	vite: UserConfig;
}

export type Config = Partial<FullConfig>;
