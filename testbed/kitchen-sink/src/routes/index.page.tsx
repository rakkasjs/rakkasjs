import { useState } from "react";
import { Page, Link } from "rakkasjs";

const HomePage: Page<never, { key: number }> = (props) => {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>Home</h1>
			<p>Hello world!</p>
			<p id="metadata">Metadata: {props.meta.key}</p>
			<p>
				<button onClick={() => setCount((old) => old + 1)}>
					Clicked: {count}
				</button>
			</p>
			<p>
				<Link href="/">Just a link</Link>
			</p>
			{import.meta.env.DEV && <p>Development mode is active.</p>}
		</>
	);
};

HomePage.preload = async () => {
	return {
		meta: { key: 2 },
		head: { title: "The page title" },
	};
};

export default HomePage;
