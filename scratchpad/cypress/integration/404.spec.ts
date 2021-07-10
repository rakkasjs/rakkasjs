describe("404 handling", () => {
	it("returns status 404 when page does not exist", () => {
		cy.request({
			url: "/no-such-page",
			method: "GET",
			failOnStatusCode: false,
		})
			.its("status")
			.should("equal", 404);
	});

	it("Shows 404 error page", () => {
		cy.visit("/404");
		// Make sure hydration is complete
		cy.get("p").should("contain", "Mounted");
		cy.get("a[data-testid='to-non-existent']").click();
		cy.get("body").should("contain.text", "Page not found");
	});

	it("fully reloads before 404", () => {
		cy.visit("/404");
		// Make sure hydration is complete
		cy.get("p").should("contain", "Mounted");
		cy.get("a[data-testid='to-external']").click();
		cy.get("body").should("contain.text", "This is not a page.");

		cy.go("back");
		cy.url().should("equal", "http://localhost:3000/404");
		cy.get("p").should("contain", "Mounted");
	});
});
