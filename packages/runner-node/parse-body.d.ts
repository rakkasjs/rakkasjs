import { IncomingMessage } from "http";

export async function parseBody(req: IncomingMessage): Promise<unknown>;
