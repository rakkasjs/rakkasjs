import { Link } from "rakkasjs";

export default function LinksPage() {
	return (
		<ul>
			<li>
				<Link href="/before-route/redirect">Redirect</Link>
			</li>
			<li>
				<Link href="/before-route/rewrite">Rewrite</Link>
			</li>
		</ul>
	);
}
