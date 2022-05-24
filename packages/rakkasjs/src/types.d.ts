declare module "isbot-fast" {
	interface IsBotFn {
		(userAgent: string): boolean;
		extend(additionalBots: string[]): void;
	}

	const isBot: IsBotFn;

	export default isBot;
}

declare module "react-dom/server.browser" {
	export * from "react-dom/server";
}
