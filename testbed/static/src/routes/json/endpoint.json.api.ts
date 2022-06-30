export function get(): Response {
	return new Response(JSON.stringify({ hello: "world" }), {
		headers: { "Content-Type": "application/json" },
	});
}
