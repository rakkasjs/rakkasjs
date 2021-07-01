import React, { useState } from "react";
import { definePage, PageTypes } from "rakkasjs";
import { Todo } from "./Todo";
import css from "./page.module.css";

import type { TodoItem } from "../../api/todo/crud";

interface TodoPageTypes extends PageTypes {
	data: TodoItem[];
}

// definePage is an alterntive way to define a page module that ensures type compatibility
export default definePage<TodoPageTypes>({
	// load() will be called before rendering the component and its returnValue.data will be passed to the
	// component as props.data. It may be called both on the server and on the client.
	async load({ fetch }) {
		// Initialized in getRootContext() at src/server.js
		// console.log("Session:", args.context.session);

		// Use the passed fetch function to make requests with credentials.
		return await fetch("/api/todo").then(async (r) => {
			if (!r.ok) {
				return {
					status: r.status,
					error: {
						message: "Failed to fetch todos",
					},
				};
			}

			return { data: await r.json() };
		});
	},

	Component({ data, reload, useReload }) {
		// This custom hook is useful for automatically reloading the page under certain conditions
		useReload({
			// Reload when the tab is activated
			focus: true,
			// Reload when the internet connection is restored
			reconnect: true,
			// Set to i.e. 15_000 to reload every 15 seconds
			// interval: false,
			// Set to true to reload on interval even when the window has no focus
			// background: false,
		});

		const [text, setText] = useState("");

		return (
			<main>
				<h1>Todo</h1>

				<p>
					This is a simple TODO application that demonstrates data fetching.
				</p>

				<ul className={css.todoList}>
					{data.map((todo) => (
						<Todo key={todo.id} todo={todo} reload={reload} />
					))}
				</ul>

				<p className={css.p}>
					<input
						className={css.input}
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>

					<button
						type="button"
						className={css.addButton}
						disabled={!text}
						onClick={async () => {
							await fetch("/api/todo", {
								method: "POST",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({ text, done: false }),
							});

							reload();
						}}
					>
						Add
					</button>
				</p>
			</main>
		);
	},
});
