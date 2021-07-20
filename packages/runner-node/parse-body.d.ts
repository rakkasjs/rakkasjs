import { IncomingMessage } from "http";
import { RakkasRequestBodyAndType } from "rakkasjs";

export async function parseBody(
	req: IncomingMessage,
): Promise<RakkasRequestBodyAndType>;
