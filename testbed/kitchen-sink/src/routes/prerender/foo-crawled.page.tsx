import { Link, useServerSideQuery } from "rakkasjs";

export default function PrerenderFooCrawledPage() {
	const { data: isPrerendered } = useServerSideQuery(() => {
		return process.env.RAKKAS_PRERENDER === "true";
	});

	return (
		<>
			<h1>FooCrawled</h1>
			{isPrerendered ? (
				<p>This page was prerendered.</p>
			) : (
				<p>This page was dynamically rendered.</p>
			)}
			<Link href="/prerender/not-prerendered">
				A page that shouldn't be prerendered
			</Link>
		</>
	);
}
