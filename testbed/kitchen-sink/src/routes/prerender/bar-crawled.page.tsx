import { Link, PrerenderResult, useServerSideQuery } from "rakkasjs";

export default function PrerenderBarCrawledPage() {
	const { data: isPrerendered } = useServerSideQuery(() => {
		return process.env.RAKKAS_PRERENDER === "true";
	});

	return (
		<>
			<h1>BarCrawled</h1>
			{isPrerendered ? (
				<p>This page was prerendered.</p>
			) : (
				<p>This page was dynamically rendered.</p>
			)}
			<Link href="/prerender/not-crawled">
				A page that shouldn't be discovered
			</Link>
		</>
	);
}

export function prerender(): PrerenderResult {
	return {
		shouldCrawl: false,
	};
}
