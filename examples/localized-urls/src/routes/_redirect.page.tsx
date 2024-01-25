import { Redirect, useRequestContext } from "rakkasjs";

export default function RedirectToDetectedLangPage() {
	let lang = "en"; // Default language
	const requestContext = useRequestContext();

	if (import.meta.env.SSR) {
		// Detect language from Accept-Language header
		const header = requestContext!.request.headers.get("accept-language");
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

	return <Redirect href={`/${lang}`} />;
}
