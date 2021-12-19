import { createContext, useContext } from "react";
import { initGlobal } from "./init-global";

// Make the context persist between hot reloads
export const LocaleContext = initGlobal(
	"LocaleContext",
	createContext<string>(RAKKAS_DEFAULT_LOCALE),
);

export function useLocale() {
	const locale = useContext(LocaleContext);

	return locale;
}
