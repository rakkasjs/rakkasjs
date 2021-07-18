import { render, screen, act } from "@testing-library/react";
import { Router } from "./Router";
import React, { ReactNode } from "react";

describe("Router", () => {
	it("renders initial content", () => {
		render(
			<Router
				render={() =>
					new Promise(() => {
						// Never resolves
					})
				}
			>
				<span data-testid="content">Loading</span>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
	});

	it("renders content", async () => {
		let resolvePromise: undefined | ((content: ReactNode) => void);

		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		render(
			<Router render={() => promise}>
				<span data-testid="content">Loading</span>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
		await act(async () =>
			resolvePromise?.(<span data-testid="content">Loaded</span>),
		);
		expect(screen.getByTestId("content")).toHaveTextContent("Loaded");
	});

	it("skips initial render if requested", async () => {
		let resolvePromise: undefined | ((content: ReactNode) => void);

		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		render(
			<Router skipInitialRender render={() => promise}>
				<span data-testid="content">Loading</span>
			</Router>,
		);

		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
		await act(async () =>
			resolvePromise?.(<span data-testid="content">Loaded</span>),
		);
		expect(screen.getByTestId("content")).toHaveTextContent("Loading");
	});

	it("rerenders on demand", async () => {
		let counter = 1;
		let callRerender: () => void;

		render(
			<Router
				render={({ rerender }) => {
					callRerender = rerender;

					return <span data-testid="content">{counter}</span>;
				}}
			>
				<span data-testid="content">Loading</span>
			</Router>,
		);

		expect(await screen.findByText("1")).toHaveTextContent("1");
		counter++;
		act(() => callRerender!());
		expect(await screen.findByText("2")).toHaveTextContent("2");
	});
});
