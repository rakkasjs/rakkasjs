import { useState } from "react";

export default function HomePage() {
	const [clicked, setClicked] = useState(0);

	return (
		<div>
			<h1>Hello world!</h1>
			<button onClick={() => setClicked((old) => old + 1)}>
				Clicked: {clicked}
			</button>
			<p>Build ID: {import.meta.env.RAKKAS_BUILD_ID}</p>
		</div>
	);
}
