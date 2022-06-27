import { runServerSideMutation } from "rakkasjs";
import { useState } from "react";

export default function RunSsmPage() {
	const [fetched, setFetched] = useState("Not fetched");
	const a = 2;
	const b = 5;

	return (
		<>
			<p>{fetched}</p>
			<p>
				<button
					onClick={async () => {
						const result = await runServerSideMutation(() => {
							return import.meta.env.SSR
								? `Computed on the server: ${a + b}`
								: `Computed on the client: ${a + b}`;
						});

						setFetched(result);
					}}
				>
					Fetch
				</button>
			</p>
		</>
	);
}
