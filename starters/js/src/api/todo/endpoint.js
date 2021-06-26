import { readAllTodos, createTodo } from "./crud";

// Any of the following functions may also return a promise

// Return all todo items
export function get() {
	return { body: readAllTodos() };
}

// Add a todo item and return its ID
export function post({ body }) {
	// In a real app you should validate all user input
	return {
		// "Created". Default status is 200
		status: 201,
		body: createTodo(body),
	};
}
