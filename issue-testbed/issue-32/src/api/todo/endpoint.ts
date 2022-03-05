import { RequestHandler } from "rakkasjs";
import { readAllTodos, createTodo } from "./crud";

// Any of the following functions may also return a promise

// Return all todo items
export const get: RequestHandler = () => ({ body: readAllTodos() });

// Add a todo item and return its ID
export const post: RequestHandler = ({ body }) => {
	// In a real app you should validate all user input
	return {
		// "201 Created". Default status is 200.
		status: 201,
		body: createTodo(body),
	};
};
