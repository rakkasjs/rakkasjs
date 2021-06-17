import { ErrorHandlerProps, Head } from "@rakkasjs/core";
import React, { FC } from "react";

const MainLayout: FC<ErrorHandlerProps> = ({ error, children }) => (
	<>
		<Head>
			<title>Rakkas.js</title>
		</Head>
		{error ? error.message : children}
	</>
);

export default MainLayout;
