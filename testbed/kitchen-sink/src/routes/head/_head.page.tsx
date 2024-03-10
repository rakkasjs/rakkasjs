import { Link, useHead, type Page } from "rakkasjs";

const HeadPage: Page = () => {
	useHead({
		canonical: "http://localhost:3000/head",
		htmlAttributes: {
			class: "head-page",
		},
	});

	return (
		<div>
			<p>Check my head tags!</p>
			<Link href="/head/elsewhere">Go elsewhere</Link>
		</div>
	);
};

export default HeadPage;

HeadPage.preload = () => ({ head: { title: "The head page" } });
