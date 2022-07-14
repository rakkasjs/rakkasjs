import { PrerenderResult, useServerSideQuery } from "rakkasjs";

export default function PrerenderFooPage() {
	const { data: isPrerendered } = useServerSideQuery(() => {
		return process.env.RAKKAS_PRERENDER === "true";
	});

	return (
		<>
			<h1>Foo</h1>
			{isPrerendered ? (
				<p>This page was prerendered.</p>
			) : (
				<p>This page was dynamically rendered.</p>
			)}
		</>
	);
}

export function prerender(): PrerenderResult {
	return {
		shouldCrawl: false,
		links: ["/prerender/foo-crawled"],
	};
}
