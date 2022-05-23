declare module "isbot-fast" {
	interface IsBotFn {
		(userAgent: string): boolean;
		extend(additionalBots: string[]): void;
	}

	const isBot: IsBotFn;

	export default isBot;
}
