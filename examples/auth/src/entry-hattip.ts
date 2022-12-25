import { createRequestHandler } from "rakkasjs";
import { Auth } from "@auth/core";
import type { Provider } from "@auth/core/providers";
import GitHubProvider, { GithubProfile } from "@auth/core/providers/github";
import DiscordProvider, { DiscordProfile } from "@auth/core/providers/discord";

export default createRequestHandler({
	middleware: {
		beforePages: [
			async (ctx) => {
				if (!ctx.url.pathname.match(/^\/auth(\/|$)/)) {
					return;
				}

				// If you want to support URL rewres and method overrides
				// create a new Request object from the context:
				//
				// const request = new Request(ctx.url, {
				// 	method: ctx.method,
				// 	headers: ctx.request.headers,
				// 	body: ctx.request.body,
				// });

				const {
					GITHUB_CLIENT_ID,
					GITHUB_CLIENT_SECRET,
					DISCORD_CLIENT_ID,
					DISCORD_CLIENT_SECRET,
				} = process.env;

				const providers: Provider[] = [];

				if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
					providers.push(
						GitHubProvider({
							clientId: GITHUB_CLIENT_ID,
							clientSecret: GITHUB_CLIENT_SECRET,
						}) as any,
					);
				} else {
					console.warn(
						"GitHub client ID and secret not set, GitHub login disabled",
					);
				}

				if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
					providers.push(
						DiscordProvider({
							clientId: DISCORD_CLIENT_ID,
							clientSecret: DISCORD_CLIENT_SECRET,
						}) as any,
					);
				} else {
					console.warn(
						"Discord client ID and secret not set, Discord login disabled",
					);
				}

				if (providers.length === 0) {
					throw new Error(
						"No authentication providers configured. " +
							"Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET and/or DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET. " +
							"You can put them in a .env file in the root of the project.",
					);
				}

				return Auth(new Request(ctx.request), {
					trustHost: true,
					secret: "nA3YFUSfC3XZdiTgAcbZel3gfj4YcCdTez7dShT+waI=",
					providers,
				});
			},
		],
	},
});
