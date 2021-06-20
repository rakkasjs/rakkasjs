import { Helmet } from "rakkasjs/helmet";
import React, { FC } from "react";

const DocLayout: FC = ({ children }) => (
	<>
		<Helmet>
			<title>Docs | Rakkas</title>
		</Helmet>
		{children}
	</>
);

export default DocLayout;
