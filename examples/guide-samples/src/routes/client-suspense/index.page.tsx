import { ClientSuspense, Head } from "rakkasjs";
import { lazy } from "react";

const ClientComponent = lazy(() => import("./ClientComponent"));

export default function ClientSuspensePage() {
	return (
		<div>
			<Head title="Client suspense" />
			<ClientSuspense fallback="Loading client-only component...">
				{<ClientComponent />}
			</ClientSuspense>
		</div>
	);
}
