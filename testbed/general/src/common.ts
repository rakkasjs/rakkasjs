import { defineCommonHooks } from "rakkasjs";

export default defineCommonHooks({
	extractLocale(url) {
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
			return {
				redirect: {
					en: "/locales/en/hello",
					fr: "/locales/fr/salut",
				},
			};
		} else {
			return { locale: "en" };
		}
	},
});
