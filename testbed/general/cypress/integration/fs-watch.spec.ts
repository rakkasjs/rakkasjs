if (Cypress.env("DEV_TEST")) {
	describe("Filesystem watcher", () => {
		beforeEach(() => {
			cy.request("DELETE", "/api/fs-watch");
		});

		afterEach(() => {
			cy.request("DELETE", "/api/fs-watch");
		});

		it("reloads when a new file is created", () => {
			cy.visit("/fs-watch/non-existent", { failOnStatusCode: false });
			cy.get("#page-content").should("contain", "Page not found");
			cy.request("POST", "/api/fs-watch");
			cy.get("#page-content").should("contain", "Now you see me!");
		});
	});
}
