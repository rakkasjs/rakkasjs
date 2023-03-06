import { CommonHooks } from "rakkasjs";

declare module "rakkasjs" {
	interface PageContext {
		lang: "en" | "fr";
	}
}

const commonHooks: CommonHooks = {
	beforePageLookup(ctx, url) {
		if (ctx.lang) {
			// This prevents infinite redirect loops
			return true;
		}

		const lang = url.pathname.split("/")[1];

		if (lang === "en" || lang === "fr") {
			url.pathname = url.pathname.slice(lang.length + 1);
			ctx.lang = lang;
		} else if (url.pathname === "/") {
			let lang = "en"; // Default language

			if (import.meta.env.SSR) {
				// Detect language from Accept-Language header
				const header =
					ctx.requestContext!.request.headers.get("accept-language");
				if (header?.startsWith("fr")) {
					lang = "fr";
				}
			} else {
				// Detect language from browser language
				const navLang = (navigator.languages ?? [navigator.language])[0];
				if (navLang?.startsWith("fr")) {
					lang = "fr";
				}
			}

			const newURL = new URL(url.href);
			newURL.pathname = `/${lang}`;

			return { redirect: newURL.href };
		}

		return true;
	},
};

export default commonHooks;
