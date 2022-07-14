import { Link, PrerenderResult, useServerSideQuery } from "rakkasjs";

export default function PrerenderBarPage() {
	const { data: isPrerendered } = useServerSideQuery(() => {
		return process.env.RAKKAS_PRERENDER === "true";
	});

	return (
		<>
			<h1>Bar</h1>
			{isPrerendered ? (
				<p>This page was prerendered.</p>
			) : (
				<p>This page was dynamically rendered.</p>
			)}
			<Link href="/prerender/bar-crawled">
				A page that will be discovered by crawling this page
			</Link>
		</>
	);
}

export function prerender(): PrerenderResult {
	return {
		shouldPrerender: false,
		shouldCrawl: true,
	};
}
