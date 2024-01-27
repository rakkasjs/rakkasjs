import { Link, usePageContext, useRouteParams } from "rakkasjs";

export default function HomePage() {
	const { lang } = useRouteParams<{ lang: "en" | "fr" }>();

	return (
		<main>
			<h1>{messages[lang]}</h1>
			<nav>
				<ul>
					<li>
						<Link href="/en">English</Link>
					</li>
					<li>
						<Link href="/fr">Français</Link>
					</li>
					<li>
						<Link href="/">Auto-detect</Link>
					</li>
				</ul>
			</nav>
		</main>
	);
}

const messages = {
	en: "Hello, world!",
	fr: "Bonjour, le monde !",
};
