import { Link, useHead, type Page } from "rakkasjs";
import { useState } from "react";

const HeadPage: Page = () => {
	const [count, setCount] = useState(0);

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
			<p>
				<button onClick={() => setCount(count + 1)}>Count: {count}</button>
			</p>
		</div>
	);
};

export default HeadPage;

HeadPage.preload = () => ({ head: { title: "The head page" } });
