import type { IncomingMessage } from "http";

export async function parseBody(req: IncomingMessage) {
	const type = req.headers["content-type"] ?? "";

	if (
		type === "text/plain" ||
		type === "application/json" ||
		type.endsWith("+json")
	) {
		let text = "";
		req.setEncoding("utf-8");

		return new Promise<unknown>((resolve, reject) => {
			req.on("data", (chunk) => (text += chunk));
			req.on("end", () => {
				if (type === "text/plain") {
					resolve(text);
				} else {
					resolve(JSON.parse(text));
				}
			});
			req.on("error", (error) => reject(error));
		});
	} else {
		const chunks: Buffer[] = [];

		return new Promise<Uint8Array>((resolve, reject) => {
			req.on("data", (chunk) => chunks.push(Buffer.from(chunk, "binary")));
			req.on("end", () => resolve(Uint8Array.from(Buffer.concat(chunks))));
			req.on("error", (error) => reject(error));
		});
	}
}
