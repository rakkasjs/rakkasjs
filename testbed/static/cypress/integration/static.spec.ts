describe("Static content", () => {
	it("visits home page", () => {
		cy.visit("/");
		cy.contains("Rakkas static site generation demo");
	});

	it("loads a stylesheet with JavaScript disabled", () => {
		cy.request("/")
			.its("body")
			.should("satisfy", (html: string) => {
				return html.match(/href="\/assets\/page\..+\.css"/);
			});
	});

	it("visits a profile page", () => {
		cy.visit("/profile/3");
		cy.contains("Lillian Taylor");
	});

	it("navigates to a profile page", () => {
		cy.visit("/");
		cy.contains("Lillian Taylor").click();
		cy.contains("Auckland (New Zealand)");
	});

	it("navigates to home page", () => {
		cy.visit("/profile/3");
		cy.contains("Home").click();
		cy.contains("Rakkas static site generation demo");
	});
});
