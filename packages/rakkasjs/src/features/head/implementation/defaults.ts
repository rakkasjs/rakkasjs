import type { HeadProps } from "./types";

export const defaultHeadProps: HeadProps = {
	title: import.meta.env.RAKKAS_DEFAULT_APP_TITLE || "Rakkas App",
	viewport: "width=device-width, initial-scale=1",
	htmlAttributes: { lang: "en" },
	elements: [{ charset: "utf-8" }],
};
