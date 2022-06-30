import { useState } from "react";
import { Head, PageProps, PreloadResult } from "rakkasjs";

export default function HomePage(props: PageProps<never, { key: number }>) {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1>Home</h1>
			<p>Hello world!</p>
			<p id="metadata">Metadata: {props.meta.key}</p>
			<button onClick={() => setCount((old) => old + 1)}>
				Clicked: {count}
			</button>
			{import.meta.env.DEV && <p>Development mode is active.</p>}
		</>
	);
}

HomePage.preload = async (): Promise<PreloadResult> => {
	return {
		meta: { key: 2 },
		seo: <Head title="The page title" />,
	};
};
