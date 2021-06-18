import { Head } from "@rakkasjs/core";
import React, { FC } from "react";

const DocLayout: FC = ({ children }) => (
	<>
		<Head>
			<title>Docs | Rakkas</title>
		</Head>
		{children}
	</>
);

export default DocLayout;
