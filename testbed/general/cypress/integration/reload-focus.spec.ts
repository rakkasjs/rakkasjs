describe("Focus on reload", () => {
	it("doesn't lose focus on reload", () => {
		cy.visit("/reload-focus");
		cy.get("strong").contains("original");

		cy.get("textarea").click().should("have.focus");

		cy.document()
			.its("reloadFocusLayout")
			.then((f) => f("updated"));

		cy.document().contains("updated", { timeout: 20_000 });
		cy.get("textarea").should("have.focus");
	});
});
