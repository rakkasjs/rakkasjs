export async function get(req) {
	const data = await (await import("./data.json")).default;

	return {
		headers: {
			"content-type": "application/json",
		},
		body: data.map((x) => ({ slug: x.slug, title: x.title })),
	};
}
