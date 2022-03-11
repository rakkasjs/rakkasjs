import { useState } from "react";

export default function HomePage() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>Home</h1>
			<p>Hello world!</p>
			<button onClick={() => setCount((old) => old + 1)}>
				Clicked: {count}
			</button>
			{import.meta.env.DEV && <p>Development mode is active.</p>}
		</>
	);
}
