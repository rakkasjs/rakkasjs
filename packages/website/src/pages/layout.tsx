import { ErrorHandlerProps, Head } from "@rakkasjs/core";
import React, { FC } from "react";

const MainLayout: FC<ErrorHandlerProps> = ({ error, children }) => (
	<>
		<Head>
			<title>Rakkas.js</title>
		</Head>
		{error ? <pre>{error.stack || error.message}</pre> : children}
	</>
);

export default MainLayout;
