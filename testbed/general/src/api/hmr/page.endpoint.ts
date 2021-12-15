import fs from "fs";
import { RequestHandler } from "rakkasjs";

export const post: RequestHandler = async (req) => {
	let from = "HMR test page - ORIGINAL";
	let to = "HMR test page - UPDATED";

	if (req.body === "revert") {
		[from, to] = [to, from];
	}

	let content = (await fs.promises.readFile(FILE_NAME, {
		encoding: "utf-8",
	})) as string;
	content = content.replace(from, to);
	await fs.promises.writeFile(FILE_NAME, content);

	return {};
};

const FILE_NAME = "src/pages/hmr/page.tsx";
