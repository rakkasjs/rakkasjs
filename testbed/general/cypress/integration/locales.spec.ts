describe("Localized URLs", () => {
	it("renders correct page on the server", () => {
		cy.visit("/locales/en/hello");
		cy.get("html").should("have.attr", "lang", "en");
		cy.get("body").should("contain.text", "Hello, world!");

		cy.visit("/locales/fr/salut");
		cy.get("html").should("have.attr", "lang", "fr");
		cy.get("body").should("contain.text", "Salut, le monde!");
	});

	it("renders correct page on the client", () => {
		cy.visit("/locales/en/hello");

		cy.contains("Français").click();

		cy.get("html").should("have.attr", "lang", "fr");
		cy.get("body").should("contain.text", "Salut, le monde!");

		cy.contains("English").click();

		cy.get("html").should("have.attr", "lang", "en");
		cy.get("body").should("contain.text", "Hello, world!");
	});

	it("redirects to the correct language", () => {
		cy.visit("/locales", {
			headers: { "Accept-Language": "fr-FR;" },
		});
		cy.url().should("include", "/locales/fr/salut");

		cy.visit("/locales", {
			headers: { "Accept-Language": "en-US;" },
		});
		cy.url().should("include", "/locales/en/hello");
	});
});
