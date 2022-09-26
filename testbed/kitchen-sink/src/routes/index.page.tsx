import { useState } from "react";
import { Head, Page } from "rakkasjs";

const HomePage: Page<never, { key: number }> = (props) => {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>Home</h1>
			<p>Hot reloadin'!</p>
			<p id="metadata">Metadata: {props.meta.key}</p>
			<button onClick={() => setCount((old) => old + 1)}>
				Clicked: {count}
			</button>
			{import.meta.env.DEV && <p>Development mode is active.</p>}
		</>
	);
};

HomePage.preload = async () => {
	return {
		meta: { key: 2 },
		head: <Head title="The page title" />,
	};
};

export default HomePage;
