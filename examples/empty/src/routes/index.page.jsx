import x from "virtual:rakkasjs:server-page-routes";
console.log(x.map((x) => x[4]));

export default function HomePage() {
	return (
		<main>
			<h1>Hello world!</h1>
		</main>
	);
}
