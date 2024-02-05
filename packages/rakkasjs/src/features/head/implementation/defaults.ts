import { HeadProps } from "./types";

export const defaultHeadProps: HeadProps = {
	title: "Rakkas App",
	viewport: "width=device-width, initial-scale=1",
	htmlAttributes: { lang: "en" },
	elements: [{ charset: "utf-8" }],
};

export const currentDefaultHeadProps = { current: defaultHeadProps };
