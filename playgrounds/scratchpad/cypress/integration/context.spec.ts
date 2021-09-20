describe("Layout context", () => {
	it("loads context", () => {
		cy.visit("/context/a");
		cy.get(".outer").contains("OUTER");
		cy.get(".inner").contains("INNER-A");

		cy.contains("Go to B").click();
		cy.get(".outer").contains("OUTER");
		cy.get(".inner").contains("INNER-B");

		cy.contains("Go to A").click();
		cy.get(".outer").contains("OUTER");
		cy.get(".inner").contains("INNER-A");
	});
});
