describe("Hot module reloading", () => {
	beforeEach(() => {
		cy.request("DELETE", "/api/hmr");
	});

	afterEach(() => {
		cy.request("DELETE", "/api/hmr");
	});

	it("reloads when a new file is created", () => {
		cy.visit("/hmr/non-existent", { failOnStatusCode: false });
		cy.get("#page-content").should("contain", "Page not found");
		cy.request("POST", "/api/hmr");
		cy.get("#page-content").should("contain", "Now you see me!");
	});
});
