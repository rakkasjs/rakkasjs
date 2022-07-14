import { Link } from "rakkasjs";

export default function PrerenderIndexPage() {
	return (
		<ul>
			<li>
				<Link href="/prerender/foo">Foo</Link>
			</li>
			<li>
				<Link href="/prerender/bar">Bar</Link>
			</li>
		</ul>
	);
}
