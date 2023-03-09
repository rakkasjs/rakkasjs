import { CommonHooks } from "rakkasjs";

declare module "rakkasjs" {
	interface PageContext {
		lang: "en" | "fr";
	}
}

const commonHooks: CommonHooks = {
	beforePageLookup(ctx, url) {
		const lang = url.pathname.split("/")[1];

		if (lang === "en" || lang === "fr") {
			ctx.lang = lang;
			const newUrl = new URL(url.href);
			newUrl.pathname = url.pathname.slice(lang.length + 1);
			return { rewrite: newUrl };
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
				// Detect language from browser language(s)
				const navLang = (navigator.languages ?? [navigator.language])[0];
				if (navLang?.startsWith("fr")) {
					lang = "fr";
				}
			}

			const newUrl = new URL(url.href);
			newUrl.pathname = `/${lang}`;

			return { redirect: newUrl.href };
		}

		return true;
	},
};

export default commonHooks;
