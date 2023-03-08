import { Button } from "@mantine/core";
import { useQuery } from "rakkasjs";
import { Suspense, useState } from "react";

export default function HelloWorld() {
	return (
		<div>
			<Button>Hello world!</Button>
			&nbsp;
			{/* This is to test that late loaded components inject styles correctly */}
			<Suspense fallback="Loading...">
				<LateLoaded />
			</Suspense>
		</div>
	);
}

function LateLoaded() {
	useQuery(
		"lazy",
		() => new Promise<void>((resolve) => setTimeout(resolve, 1000)),
	);

	const [state, setState] = useState(false);

	return (
		<Button
			onClick={() => setState((old) => !old)}
			color={state ? "grape" : "cyan"}
		>
			Click me to change color
		</Button>
	);
}
