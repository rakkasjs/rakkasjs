describe("Body parsing works correctly", () => {
	it("parses binary", () => {
		cy.request({
			url: "/api/body-parser",
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: Cypress.Blob.arrayBufferToBlob(new Uint8Array([1, 2, 3, 4])),
		})
			.then((r) => {
				// For some reason, cy.request is confused by the different encoding
				const td = new TextDecoder("utf-8");
				return JSON.parse(td.decode(r.body));
			})
			.should("deep.equal", {
				type: "Uint8Array",
				value: { 0: 1, 1: 2, 2: 3, 3: 4 },
			});
	});

	it("parses plain text", () => {
		cy.request({
			url: "/api/body-parser",
			method: "POST",
			headers: {
				"Content-Type": "text/plain",
			},
			body: "xxxxx",
		})
			.its("body")
			.should("deep.equal", { type: "String", value: "xxxxx" });
	});

	it("parses json", () => {
		cy.request({
			url: "/api/body-parser",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ a: "aaa", b: "bbb" }),
		})
			.its("body")
			.should("deep.equal", {
				type: "Object",
				value: { a: "aaa", b: "bbb" },
			});
	});

	it("parses urlencoded", () => {
		cy.request({
			url: "/api/body-parser",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: "a=aaa&b=bbb",
		})
			.its("body")
			.should("deep.equal", {
				type: "URLSearchParams",
				value: { a: "aaa", b: "bbb" },
			});
	});

	it("parses plain text in different encoding", () => {
		cy.request({
			url: "/api/body-parser",
			method: "POST",
			headers: {
				"Content-Type": "text/plain;charset=utf16le",
			},
			body: Cypress.Blob.arrayBufferToBlob(
				new Uint8Array([0x41, 0x00, 0x1e, 0x01]),
			),
		})
			.then((r) => {
				// For some reason, cy.request is confused by the different encoding
				const td = new TextDecoder("utf-8");
				return JSON.parse(td.decode(r.body));
			})
			.should("deep.equal", { type: "String", value: "AĞ" });
	});
});
