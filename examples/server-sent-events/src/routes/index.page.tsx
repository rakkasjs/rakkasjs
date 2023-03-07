/* eslint-disable ssr-friendly/no-dom-globals-in-react-fc */
import { ClientOnly } from "rakkasjs";
import { lazy } from "react";

const ChatClient = lazy(() => import("./ChatClient"));

export default function HomePage() {
	return (
		<main>
			<ClientOnly fallback="Loading...">
				<ChatClient />
			</ClientOnly>
		</main>
	);
}
