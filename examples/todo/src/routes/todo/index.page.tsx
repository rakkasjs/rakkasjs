import { useState } from "react";
import { Todo } from "./Todo";
import css from "./page.module.css";
import {
	Page,
	queryOptions,
	runServerSideQuery,
	useQuery,
	useQueryClient,
	useServerSideMutation,
} from "rakkasjs";

import { createTodo, readAllTodos } from "src/crud";

const TodoPage: Page = () => {
	const { data } = useQuery(todos);

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
	ctx.queryClient.prefetchQuery(todos);
};

const todos = queryOptions({
	queryKey: "todos",
	queryFn(ctx) {
		return runServerSideQuery(ctx.requestContext, readAllTodos);
	},
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
});
