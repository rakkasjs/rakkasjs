describe.only("Root context", () => {
	it("setRootContext and navigate interact correctly", () => {
		cy.visit("/root-context");

		cy.get("#mounted").should("contain", "Mounted");

		cy.get("#session-value").should("contain", "Initial session value");

		cy.get("button").click();

		cy.get("#updated-session-value").should("contain", "New session value");
	});
});
