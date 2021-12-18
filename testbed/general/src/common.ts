import { defineCommonHooks } from "rakkasjs";

export default defineCommonHooks({
	selectLocale(url, detect) {
		if (url.pathname === "/locales/fr/salut") {
			return {
				locale: "fr",
				url: "/locales/hello",
			};
		} else if (url.pathname === "/locales/en/hello") {
			return {
				locale: "en",
				url: "/locales/hello",
			};
		} else if (url.pathname === "/locales") {
			const lang = detect();

			return {
				redirect: lang.startsWith("en")
					? "/locales/en/hello"
					: "/locales/fr/salut",
			};
		} else {
			return { locale: "en" };
		}
	},
});
