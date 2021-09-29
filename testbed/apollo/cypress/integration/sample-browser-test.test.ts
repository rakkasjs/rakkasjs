describe("Sample browser test", () => {
	it("visits home page", () => {
		cy.visit("/");
		cy.contains("Rakkas");
	});
});
