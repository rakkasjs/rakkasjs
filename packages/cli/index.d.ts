import { UserConfig } from "vite";

export function defineConfig(config: Config);

export interface FullConfig {
	viteConfig: UserConfig;
}

export type Config = Partial<FullConfig>;
