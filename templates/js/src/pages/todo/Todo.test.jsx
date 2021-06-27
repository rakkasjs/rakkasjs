import React from "react";
import { Todo } from "./Todo";
import { render, screen } from "@testing-library/react";
import css from "./todo.module.css";

describe("Todo", () => {
	const noop = () => {
		// Do nothing
	};

	it("renders finished todo item with correct class", async () => {
		render(
			<Todo reload={noop} todo={{ id: 1, text: "It's done", done: true }} />,
		);

		expect(await screen.findByText("It's done")).toHaveClass(css.done);
	});
});
