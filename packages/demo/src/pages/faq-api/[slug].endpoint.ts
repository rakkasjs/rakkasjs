export async function get({ params: { slug } }: { params: { slug: string } }) {
	const data = await (await import("./data.json")).default;

	const found = data.find((x) => x.slug === slug);

	if (found) {
		return {
			headers: {
				"content-type": "application/json",
			},
			body: found,
		};
	} else {
		return {
			status: 404,
			headers: {
				"content-type": "application/json",
			},
			body: { error: "FAQ entry not found" },
		};
	}
}
