import React, { useState } from "react";
import { Todo } from "./Todo";
import css from "./todo.module.css";

export default function TodoPage({ data, reload, useReload }) {
	// This custom hook will force a reload when the user switches to another tab and back.
	// Try opening the app in two separate tabs, make some changes in one tab and observe how
	// they are reflected on the other tab as soon as you switch.
	useReload({ focus: true });

	const [text, setText] = useState("");

	return (
		<main>
			<h1>Todo</h1>

			<p>This is a simple TODO application that demonstrates data fetching.</p>

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
}

export async function load({ fetch }) {
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
}
