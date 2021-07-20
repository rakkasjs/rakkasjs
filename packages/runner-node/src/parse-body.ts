import type { IncomingMessage } from "http";
import type { RakkasRequestBodyAndType } from "rakkasjs";

export async function parseBody(
	req: IncomingMessage,
): Promise<RakkasRequestBodyAndType> {
	const bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
		const limit = 1048576; // 1 MB
		const chunks: Buffer[] = [];
		let totalLength = 0;

		req.on("data", (chunk) => {
			const len = Buffer.byteLength(chunk);
			totalLength += len;
			if (totalLength > limit) {
				const error = new Error("Body length limit exceeded");
				(error as any).status = 413;
				reject(error);
			}

			chunks.push(Buffer.from(chunk, "binary"));
		});

		req.on("end", () => resolve(Buffer.concat(chunks)));

		req.on("error", (error) => reject(error));
	});

	if (bodyBuffer.length === 0) {
		return { type: "empty" };
	}

	const [type, ...directives] = (req.headers["content-type"] || "").split(";");
	const isJson = type === "application/json" || type.endsWith("+json");
	const isUrlEncoded = type === "application/x-www-form-urlencoded";

	if (type.startsWith("text/") || isJson || isUrlEncoded) {
		const dirs = Object.fromEntries(
			directives.map((dir) => dir.split("=").map((x) => x.trim())),
		);

		let text: string;
		try {
			text = bodyBuffer.toString(dirs.charset || "utf-8");
		} catch (error) {
			(error as any).status = 400;
			throw error;
		}

		if (isJson) {
			try {
				return { type: "json", body: JSON.parse(text) };
			} catch (error) {
				(error as any).status = 400;
				throw error;
			}
		} else if (isUrlEncoded) {
			return {
				type: "form-data",
				body: new URLSearchParams(text),
			};
		}

		return { type: "text", body: text };
	}

	return { type: "binary", body: new Uint8Array(bodyBuffer) };
}
