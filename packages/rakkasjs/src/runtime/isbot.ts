const BOT_REGEX =
	/bot|check|cloud|crawler|curl|download|facebookexternalhit|flipboard|google|heritrix|ia_archiver|monitor|perl|preview|python|qwantify|scan|spider|tumblr|vkshare|wget|whatsapp|yahoo/i;

export function isBot(agent: string): boolean {
	return BOT_REGEX.test(agent);
}
