import { PageRouteGuard } from "rakkasjs";

export const pageGuard: PageRouteGuard = (ctx) => {
	const { lang } = ctx.params;
	// Only allow existing languages
	return lang === "en" || lang === "fr";
};
