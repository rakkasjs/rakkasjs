import fetch from "node-fetch";

describe("Apollo server", () => {
	it("responds to requests", async () => {
		const host = process.env.HOST || "localhost";
		const port = process.env.PORT || "3000";

		// Normally you would make an API request here instead of fetching a page
		const response = await fetch(`http://${host}:${port}/api/graphql`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ query: "{hello}" }),
		});

		expect(response.ok).toBe(true);
		expect(await response.json()).toMatchObject({ data: { hello: "world" } });
	});
});
