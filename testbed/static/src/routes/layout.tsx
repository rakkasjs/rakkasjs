import { Link, LayoutProps } from "rakkasjs";
import { useEffect } from "react";

export default function MainLayout({ children }: LayoutProps) {
	useEffect(() => {
		document.body.classList.add("hydrated");
	});

	return (
		<>
			{children}
			<nav>
				<ul>
					<li>
						<Link href="/">Home</Link>
					</li>
					<li>
						<Link href="/json">Render API route</Link>
					</li>
					<li>
						<Link href="/redirect">Redirect</Link>
					</li>
					<li>
						<Link href="/ssq">Server-side query</Link>
					</li>
				</ul>
			</nav>
		</>
	);
}
