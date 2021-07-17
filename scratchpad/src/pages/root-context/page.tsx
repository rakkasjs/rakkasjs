import React, { useEffect, useState } from "react";
import { definePage, useRakkas, navigate } from "rakkasjs";

export default definePage({
	Component: function RootContextPage({ context }) {
		const [mounted, setMounted] = useState(false);
		const { setRootContext } = useRakkas();

		useEffect(() => {
			setMounted(true);
		}, []);

		return (
			<>
				<p id="session-value">{context.session}</p>
				<button
					onClick={() => {
						navigate("/root-context/updated");
						setRootContext({ session: "New session value" });
					}}
				>
					Set root context
				</button>
				{mounted && <p id="mounted">Mounted</p>}
			</>
		);
	},
});
