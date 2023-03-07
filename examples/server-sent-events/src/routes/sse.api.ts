import { RequestContext } from "rakkasjs";
import {
	text,
	serverSentEvents,
	ServerSentEventSink,
	ServerSentEvent,
} from "@hattip/response";

// Remember the last 10 messages
const MAX_MESSAGES = 10;
const messageHistory: (ServerSentEvent | undefined)[] =
	Array(MAX_MESSAGES).fill(undefined);
let nextMessageIndex = 0;
let nextId = 1;

export function get(ctx: RequestContext) {
	const clientId = ctx.url.searchParams.get("clientId");
	if (!clientId || !isValidConnectionId(clientId)) {
		return text("Invalid connection ID", { status: 400 });
	}

	const lastMessageId = Number(ctx.request.headers.get("Last-Event-ID")) || 0;

	let thisSink: ServerSentEventSink;
	let pingInterval: ReturnType<typeof setInterval>;

	return serverSentEvents({
		onOpen(sink) {
			thisSink = sink;
			connections.add(sink);
			sink.ping();
			pingInterval = setInterval(() => sink.ping(), 10_000);

			// Send missed messages
			const diff = Math.min(nextId - lastMessageId - 1, messageHistory.length);
			if (diff >= 0) {
				const start =
					(nextMessageIndex - diff + messageHistory.length) %
					messageHistory.length;
				const end = nextMessageIndex;

				let i = start;
				do {
					const message = messageHistory[i];
					if (message) {
						sink.send(message);
					}
					i = (i + 1) % messageHistory.length;
				} while (i !== end);
			}
		},
		onClose() {
			connections.delete(thisSink);
			clearInterval(pingInterval);
		},
	});
}

const connections = new Set<ServerSentEventSink>();

export function broadcastMessage(data: string) {
	const id = (nextId++).toString();
	const message: ServerSentEvent = { data, id };
	messageHistory[nextMessageIndex] = message;
	nextMessageIndex = (nextMessageIndex + 1) % messageHistory.length;

	for (const sink of connections.values()) {
		sink.send(message);
	}
}

function isValidConnectionId(id: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		id,
	);
}
