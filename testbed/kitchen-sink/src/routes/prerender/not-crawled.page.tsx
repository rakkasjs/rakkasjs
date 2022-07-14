import { Link, useServerSideQuery } from "rakkasjs";

export default function PrerenderNotCrawledPage() {
	const { data: isPrerendered } = useServerSideQuery(() => {
		return process.env.RAKKAS_PRERENDER === "true";
	});

	return (
		<>
			<h1>NotCrawled</h1>
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
