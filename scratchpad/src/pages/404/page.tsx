import React, { useEffect, useState } from "react";
import { definePage, Link } from "rakkasjs";

export default definePage({
	Component: function LinkToNonExistent() {
		const [mounted, setMounted] = useState(false);

		useEffect(() => {
			setMounted(true);
		}, []);

		return (
			<main>
				<Link data-testid="to-external" href="/not-a-page.html">
					To external
				</Link>
				<Link data-testid="to-non-existent" href="/no-such-page">
					To non-existent
				</Link>
				{mounted && <p>Mounted</p>}
			</main>
		);
	},
});
