import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { Router } from "./Router";
import { Link } from "./Link";
import React from "react";

describe("Link", () => {
	const originalScrollTo = window.scrollTo;
	const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

	let renderNumber = 0;
	window.requestAnimationFrame = (fn) => {
		fn(50);
		return renderNumber++;
	};

	beforeEach(() => {
		window.history.replaceState(undefined, "", "http://localhost/");
		window.scrollTo = jest.fn();
		HTMLElement.prototype.scrollIntoView = jest.fn();
	});

	afterEach(() => {
		window.scrollTo = originalScrollTo;
		HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
	});

	it("rerenders when a link is clicked", async () => {
		render(
			<Router
				skipInitialRender
				render={({ url }) => (
					<span data-testid="content">Loaded: {url.href}</span>
				)}
			>
				<span data-testid="content">Loading</span>
				<Link href="/go">Go</Link>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
		act(() => screen.getByText("Go").click());
		expect(
			await screen.findByText("Loaded: http://localhost/go"),
		).toHaveTextContent("Loaded: http://localhost/go");
		expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 0 });
	});

	it("sets window.location when link origin is different", async () => {
		const oldWindowLocation = window.location;
		// @ts-expect-error: We're gonna redifine it shortly
		delete window.location;

		window.location = Object.defineProperties(
			{},
			{
				...Object.getOwnPropertyDescriptors(oldWindowLocation),
				assign: {
					configurable: true,
					value: jest.fn(),
				},
			},
		) as any;

		try {
			render(
				<Router
					skipInitialRender
					render={({ url }) => (
						<span data-testid="content">Loaded: {url.href}</span>
					)}
				>
					<span data-testid="content">Loading</span>
					<Link href="http://example.com/go">Go</Link>
				</Router>,
			);

			expect(screen.getByTestId("content")).toHaveTextContent("Loading");
			act(() => screen.getByText("Go").click());
			expect(window.location.assign).toHaveBeenCalledWith(
				"http://example.com/go",
			);
		} finally {
			window.location = oldWindowLocation;
		}
	});

	it("sets window.location for hash changes", async () => {
		render(
			<Router
				skipInitialRender
				render={({ url }) => (
					<span data-testid="content">Loaded: {url.href}</span>
				)}
			>
				<span data-testid="content">Loading</span>
				<Link href="#go">Go</Link>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
		act(() => screen.getByText("Go").click());
		expect(window.location.href).toBe("http://localhost/#go");
	});

	it("scrolls to hash", async () => {
		render(
			<Router
				skipInitialRender
				render={({ url }) => (
					<span data-testid="content" id="deep-linked">
						Loaded: {url.href}
					</span>
				)}
			>
				<span data-testid="content">Loading</span>
				<Link href="/deep#deep-linked">Go</Link>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
		act(() => screen.getByText("Go").click());

		const span = await screen.findByText(
			"Loaded: http://localhost/deep#deep-linked",
		);
		expect(span).toHaveTextContent("Loaded: http://localhost/deep#deep-linked");
		expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
		// @ts-expect-error: Mock types are not available
		const instance = HTMLElement.prototype.scrollIntoView.mock.instances[0];
		expect(span).toBe(instance);
	});
});
