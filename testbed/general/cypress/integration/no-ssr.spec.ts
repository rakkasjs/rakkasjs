describe("Client-side rendering", () => {
	it("opts out of SSR", () => {
		cy.visit("/no-ssr?waitBeforeHydrating");

		cy.get("#rakkas-app").should("contain", "Loading client-rendered page");

		cy.document()
			.its("rakkasHydrate")
			.then((f) => f());

		cy.get("#rakkas-app").should(
			"contain",
			"This page is rendered on the client-side.",
		);
	});
});
