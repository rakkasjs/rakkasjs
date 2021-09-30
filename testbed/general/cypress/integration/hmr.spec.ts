if (Cypress.env("DEV_TEST")) {
	describe("Hot module reloading", () => {
		beforeEach(() => {
			// The delay is needed to aoid confusing Vite's file watcher
			cy.wait(500);

			cy.request({
				method: "POST",
				url: "/api/hmr/page",
				body: "revert",
				headers: { "content-type": "text/plain" },
			});

			cy.request({
				method: "POST",
				url: "/api/hmr/layout",
				body: "revert",
				headers: { "content-type": "text/plain" },
			});
		});

		after(() => {
			// The delay is needed to aoid confusing Vite's file watcher
			cy.wait(500);

			cy.request({
				method: "POST",
				url: "/api/hmr/page",
				body: "revert",
				headers: { "content-type": "text/plain" },
			});

			cy.request({
				method: "POST",
				url: "/api/hmr/layout",
				body: "revert",
				headers: { "content-type": "text/plain" },
			});
		});

		it("hot reloads a page", () => {
			cy.visit("/hmr");
			cy.get("#hydrated").should("contain", "Hydrated");
			cy.get("#page-p").should("contain", "HMR test page - ORIGINAL");
			cy.request("POST", "/api/hmr/page");
			cy.get("#page-p").should("contain", "HMR test page - UPDATED");
		});

		it("hot reloads a layout", () => {
			cy.visit("/hmr");
			cy.get("#hydrated").should("contain", "Hydrated");
			cy.get("#layout-p").should("contain", "HMR test layout - ORIGINAL");
			cy.request("POST", "/api/hmr/layout");
			cy.get("#layout-p").should("contain", "HMR test layout - UPDATED");
		});

		it("hot reloads a page in SSR mode", () => {
			cy.visit("/hmr");
			cy.get("#hydrated").should("contain", "Hydrated");

			cy.get("#page-p").should("contain", "HMR test page - ORIGINAL");
			cy.request("POST", "/api/hmr/page");
			cy.get("#page-p").should("contain", "HMR test page - UPDATED");

			cy.visit("/hmr?waitBeforeHydrating");
			cy.get("#page-p").should("contain", "HMR test page - UPDATED");

			cy.document()
				.its("rakkasHydrate")
				.then((f) => f());
			cy.get("#hydrated").should("contain", "Hydrated");
		});

		it("hot reloads a layout in SSR mode", () => {
			cy.visit("/hmr");
			cy.get("#hydrated").should("contain", "Hydrated");

			cy.get("#layout-p").should("contain", "HMR test layout - ORIGINAL");
			cy.request("POST", "/api/hmr/layout");
			cy.get("#layout-p").should("contain", "HMR test layout - UPDATED");

			cy.visit("/hmr?waitBeforeHydrating");
			cy.get("#layout-p").should("contain", "HMR test layout - UPDATED");

			cy.document()
				.its("rakkasHydrate")
				.then((f) => f());
			cy.get("#hydrated").should("contain", "Hydrated");
		});
	});
}
