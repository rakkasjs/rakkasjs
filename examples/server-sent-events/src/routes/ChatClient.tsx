/* eslint-disable ssr-friendly/no-dom-globals-in-react-fc */
import { runServerSideMutation, useMutations } from "rakkasjs";
import { useEffect, useState } from "react";
import { broadcastMessage } from "src/routes/sse.api";

let clientId: string;
let eventSource: EventSource;

export default function ChatClient() {
	if (!clientId) {
		clientId = sessionStorage.getItem("clientId") ?? "";
		if (!clientId) {
			clientId = crypto.randomUUID();
			sessionStorage.setItem("clientId", clientId);
		}
	}

	eventSource = eventSource ?? new EventSource(`/sse?clientId=${clientId}`);

	const [readyState, setReadyState] = useState(eventSource.readyState);
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		eventSource.onopen = () => {
			setReadyState(eventSource.readyState);
		};

		eventSource.onerror = () => {
			setReadyState(eventSource.readyState);
		};

		eventSource.onmessage = (event) => {
			setMessages((messages) => [...messages, event.data]);
		};
	}, []);

	const { mutate } = useMutations<void, { id: string; message: string }>(
		async (vars) => {
			runServerSideMutation(() => {
				broadcastMessage(vars.id + ": " + vars.message);
			});
		},
	);

	return (
		<div>
			<p>Status: {readyState ? "Connected" : "Connecting..."}</p>
			<ul>
				{messages.map((message, i) => (
					<li key={i}>{message}</li>
				))}
			</ul>
			<p>Client ID: {clientId}</p>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const message = fd.get("message") as string;
					mutate({ id: clientId, message });
				}}
			>
				<textarea name="message" />
				<p>
					<button type="submit">Send</button>
				</p>
			</form>
		</div>
	);
}
