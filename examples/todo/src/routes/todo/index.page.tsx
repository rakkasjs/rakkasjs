import { useState } from "react";
import { Todo } from "./Todo";
import css from "./page.module.css";
import {
	Page,
	runServerSideQuery,
	useQueryClient,
	useServerSideMutation,
	useServerSideQuery,
} from "rakkasjs";

import { createTodo, readAllTodos } from "src/crud";

const TodoPage: Page = () => {
	const { data } = useServerSideQuery(readAllTodos, {
		key: "todos",
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});

	const [text, setText] = useState("");

	const client = useQueryClient();

	const { mutate: create } = useServerSideMutation(
		async () => {
			createTodo({ text, done: false });
		},
		{
			onSuccess() {
				client.invalidateQueries("todos");
			},
		},
	);

	return (
		<main>
			<h1>Todo</h1>

			<p>This is a simple todo application that demonstrates data fetching.</p>

			<ul className={css.todoList}>
				{data.map((todo) => (
					<Todo key={todo.id} todo={todo} />
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
					onClick={() => create()}
				>
					Add
				</button>
			</p>
		</main>
	);
};

export default TodoPage;

TodoPage.preload = (ctx) => {
	if (!ctx.queryClient.getQueryData("todos")) {
		ctx.queryClient.prefetchQuery(
			"todos",
			runServerSideQuery(ctx.requestContext, readAllTodos),
		);
	}
};
