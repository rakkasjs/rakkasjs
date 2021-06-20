import { deleteTodo, updateTodo } from "./crud";

// Delete a todo item
export function del({ params }) {
	// In a real app you would validate the body to make sure it contains a valid todo item
	deleteTodo(Number(params.todoId));

	return {
		body: null,
	};
}

// Update a todo item
export function patch({ params, body }) {
	// In a real app you would validate the body to make sure it contains a valid todo item
	const updated = updateTodo(Number(params.todoId), body);

	if (!updated) {
		return {
			status: 404,
		};
	}

	return {
		status: 200,
		body: updated,
	};
}
