import { ClientOnly, useServerSideQuery } from "rakkasjs";
import * as serverDot from "./server-only.server";
import * as clientDot from "./client-only.client";
import * as serverSlash from "./server/only";
import * as clientSlash from "./client/only";
import "./style.server.css";
import text from "./asset.server.txt";

export default function ClientOnlyServerOnlyPage() {
	return (
		<ClientOnly fallback={<p>Loading...</p>}>
			<ClientOnlyServerOnly />
		</ClientOnly>
	);
}

function ClientOnlyServerOnly() {
	const { data: server } = useServerSideQuery(() => ({
		serverDot: { named: serverDot.named, default: serverDot.default },
		clientDot: { named: clientDot.named, default: clientDot.default },
		serverSlash: { named: serverSlash.named, default: serverSlash.default },
		clientSlash: { named: clientSlash.named, default: clientSlash.default },
		text,
	}));

	const client = {
		serverDot: { named: serverDot.named, default: serverDot.default },
		clientDot: { named: clientDot.named, default: clientDot.default },
		serverSlash: { named: serverSlash.named, default: serverSlash.default },
		clientSlash: { named: clientSlash.named, default: clientSlash.default },
		text,
	};

	const pass =
		server.serverDot.named &&
		server.serverDot.default &&
		!server.clientDot.named &&
		!server.clientDot.default &&
		client.clientDot.named &&
		client.clientDot.default &&
		!client.serverDot.named &&
		!client.serverDot.default &&
		server.serverSlash.named &&
		server.serverSlash.default &&
		!server.clientSlash.named &&
		!server.clientSlash.default &&
		client.clientSlash.named &&
		client.clientSlash.default &&
		!client.serverSlash.named &&
		!client.serverSlash.default &&
		server.text &&
		!client.text;

	return pass ? <p>Pass</p> : <p>Fail</p>;
}
