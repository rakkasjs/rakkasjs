describe("Styles", () => {
	it("applies styles on the server", () => {
		cy.visit("/");
		cy.contains("RED").should("have.css", "color", "rgb(255, 0, 0)");
	});

	it("hydrates styles on the client", () => {
		cy.visit("/");
		cy.document().should("have.prop", "rakkasHydrate");

		// Hydrate
		cy.document()
			.its("rakkasHydrate")
			.then((f) => f());
		// Wait until hydrated
		cy.document().its("body").should("have.class", "hydrated");

		cy.contains("RED").should("have.css", "color", "rgb(255, 0, 0)");
	});
});
