import React, { useState, FC } from "react";
import css from "./Todo.module.css";

import type { TodoItem } from "../../api/todo/crud";

export interface TodoProps {
	todo: TodoItem;
	reload(): void;
}

export const Todo: FC<TodoProps> = ({ todo, reload }) => {
	const [state, setState] = useState({ text: todo.text, editing: false });
	// const state = { text: todo.text, editing: false };

	async function update(data: Partial<TodoItem>) {
		await fetch(`/api/todo/${todo.id}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ ...todo, ...data }),
		});

		reload();
	}

	return (
		<li className={css.item} key={todo.id}>
			{!state.editing && (
				<label>
					<input
						type="checkbox"
						checked={todo.done}
						onChange={(e) => update({ done: e.target.checked })}
					/>{" "}
					<span className={todo.done ? css.done : undefined}>{todo.text}</span>{" "}
				</label>
			)}

			{state.editing && (
				<input
					className={css.input}
					autoFocus
					value={state.text}
					onChange={(e) => setState({ text: e.target.value, editing: true })}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setState({ text: todo.text, editing: false });
							update({ text: state.text });
						} else if (e.key === "Escape") {
							setState({ text: todo.text, editing: false });
						}
					}}
				/>
			)}

			<span className={css.buttons}>
				{!todo.done && !state.editing && (
					<button
						type="button"
						onClick={() => setState({ text: todo.text, editing: true })}
					>
						Edit
					</button>
				)}

				{todo.done && (
					<button
						type="button"
						onClick={async () => {
							await fetch(`/api/todo/${todo.id}`, {
								method: "DELETE",
							});

							reload();
						}}
					>
						Delete
					</button>
				)}

				{state.editing && state.text !== todo.text && (
					<button
						type="button"
						onClick={async () => {
							setState({ text: todo.text, editing: false });
							update({ text: state.text });
						}}
					>
						Save
					</button>
				)}

				{state.editing && (
					<button
						type="button"
						onClick={() => setState({ text: todo.text, editing: false })}
					>
						Cancel
					</button>
				)}
			</span>
		</li>
	);
};
