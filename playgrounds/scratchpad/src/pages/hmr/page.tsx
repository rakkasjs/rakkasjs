import React, { useEffect, useState } from "react";
import { definePage } from "rakkasjs";

export default definePage({
	Component: function HmrPage() {
		const [hydrated, setHydrated] = useState(false);

		useEffect(() => {
			setHydrated(true);
		}, []);

		return (
			<>
				<p id="page-p">HMR test page - ORIGINAL</p>
				{hydrated && <p id="hydrated">Hydrated</p>}
			</>
		);
	},
});
