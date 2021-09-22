if (process.env.DEV_TEST) {
	describe("Hot module reloading", () => {
		before(() => {
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
	});
}
