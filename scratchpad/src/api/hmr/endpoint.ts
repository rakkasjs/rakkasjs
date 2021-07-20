import fs from "fs";
import { RequestHandler } from "rakkasjs";

export const del: RequestHandler = async () => {
	console.log("Deleting file");
	await fs.promises.unlink(FILE_NAME).catch(() => {
		// Do nothing
	});

	return {};
};

export const post: RequestHandler = async () => {
	console.log("Creating file");
	await fs.promises.writeFile(FILE_NAME, FILE_CONTENT);

	return {};
};

const FILE_NAME = "src/pages/hmr/non-existent.page.tsx";

const FILE_CONTENT = `import React from "react";
import { definePage } from "rakkasjs";

export default definePage({
	Component: function HomePage() {
		return <p>Now you see me!</p>;
	},
});
`;
