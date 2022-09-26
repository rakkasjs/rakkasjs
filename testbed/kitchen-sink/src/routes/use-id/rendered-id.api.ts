import { uniqueId } from "./_useId.page";

export function get() {
	return new Response(uniqueId);
}
