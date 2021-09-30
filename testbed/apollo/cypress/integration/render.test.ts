describe("GraphQL data rendering", () => {
	it("renders on the server", () => {
		cy.visit("/");
		cy.get(".data1").contains("data1 response");
		cy.get(".data2").contains("data2 response");
		cy.get(".data3").should("not.exist");

		// Hydrate
		cy.document()
			.its("rakkasHydrate")
			.then((f) => f());
		// Wait until hydrated
		cy.document().its("body").should("have.class", "hydrated");

		cy.get(".data1").contains("data1 response");
		cy.get(".data2").contains("data2 response");
		cy.get(".data3").contains("data3 response");
	});

	it("renders on the client", () => {
		cy.visit("/other");

		// Hydrate
		cy.document()
			.its("rakkasHydrate")
			.then((f) => f());
		// Wait until hydrated
		cy.document().its("body").should("have.class", "hydrated");

		cy.contains("Home page").click();

		cy.get(".data1").contains("data1 response");
		cy.get(".data2").contains("data2 response");
		cy.get(".data3").contains("data3 response");
	});
});
