import { Link, type Page } from "rakkasjs";

const HeadPage: Page = () => (
	<div>
		<p>Check my head tags!</p>
		<Link href="/head/elsewhere">Go elsewhere</Link>
	</div>
);

export default HeadPage;

HeadPage.preload = () => ({
	head: {
		title: "The head page",
		canonical: {
			tagName: "link",
			rel: "canonical",
			href: "http://localhost:3000/head",
		},
		htmlAttributes: {
			class: "head-page",
		},
	},
});
