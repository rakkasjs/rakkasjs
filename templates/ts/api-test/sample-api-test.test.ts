import fetch from "node-fetch";

describe("Sample API test", () => {
	it("fetches main page", async () => {
		const host = process.env.HOST || "localhost";
		const port = process.env.PORT || "3000";

		// Normally you would make an API request here instead of fetching a page
		const response = await fetch(`http://${host}:${port}/`);
		expect(response.ok).toBe(true);
	});
});
