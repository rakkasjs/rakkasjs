import type { Page } from "rakkasjs";

const HeadPage: Page = () => <p>Check my head tags!</p>;

export default HeadPage;

HeadPage.preload = () => ({
	head: {
		title: "The head page",
		canonical: {
			tagName: "link",
			rel: "canonical",
			href: "http://localhost:3000/head",
		},
	},
});
