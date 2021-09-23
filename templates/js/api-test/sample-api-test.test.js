import fetch from "node-fetch";

describe("Sample API test", () => {
	it("fetches main page", async () => {
		// Normally you would make an API instead of fetching the file here
		const response = await fetch("http://localhost:3000/");
		expect(response.ok).toBe(true);
	});
});
