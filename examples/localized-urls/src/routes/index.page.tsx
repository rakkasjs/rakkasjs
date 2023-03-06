import { usePageContext } from "rakkasjs";

export default function HomePage() {
	const { lang } = usePageContext();

	return (
		<main>
			<h1>{messages[lang]}</h1>
		</main>
	);
}

const messages = {
	en: "Hello, world!",
	fr: "Salut, le monde!",
};
