describe.only("Sign in", () => {
	it("sign in works correctly", () => {
		cy.visit("/sign-in/signed-in");

		// Redirects to sign in
		cy.url().should("equal", "http://localhost:3000/sign-in");

		cy.get("[name='email']").type("admin@example.com");
		cy.get("[name='password']").type("topsecret");
		cy.get("button").click();

		cy.url().should("equal", "http://localhost:3000/sign-in/signed-in");
		cy.get("#greeting").should("contain", "Hello admin@example.com!");
	});
});
